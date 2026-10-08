import { XMLParser } from 'fast-xml-parser';
import { notaSchema, type Nota } from './schemas';

/** Erro de leitura com mensagem pronta para o usuário (nunca ecoa o conteúdo do XML). */
export class ErroNfe extends Error {}

const TAMANHO_MAXIMO = 2_000_000;

// Entidades desligadas: o XML da nota não precisa delas, e assim não há expansão de entidade.
// Valores ficam como texto: EAN e NCM têm zeros à esquerda que um número perderia.
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: false,
  removeNSPrefix: true,
  trimValues: true,
  isArray: (nome) => nome === 'det',
});

type No = Record<string, unknown>;
const no = (v: unknown): No => (v && typeof v === 'object' ? (v as No) : {});
const texto = (v: unknown): string | null => {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  return null;
};
const numero = (v: unknown): number => Number(texto(v) ?? NaN);
const ou = (re: RegExp, v: string | null): string | null => (v && re.test(v) ? v : null);

/**
 * Lê o XML de uma NF-e (modelo 55) ou NFC-e (65), com ou sem o envelope nfeProc,
 * e devolve a nota já validada pelo notaSchema.
 * @param xml Conteúdo do arquivo .xml.
 * @throws ErroNfe com mensagem para o usuário quando o arquivo não é uma nota válida.
 */
export function lerNfe(xml: string): Nota {
  if (xml.length > TAMANHO_MAXIMO) throw new ErroNfe('Arquivo grande demais para uma NF-e.');
  let raiz: No;
  try {
    raiz = no(parser.parse(xml));
  } catch {
    throw new ErroNfe('O arquivo não é um XML válido.');
  }
  if (raiz.procEventoNFe || raiz.evento) {
    throw new ErroNfe(
      'Este XML é de um evento (cancelamento ou carta de correção), não de uma nota.',
    );
  }
  const proc = no(raiz.nfeProc);
  const nfe = no(proc.NFe ?? raiz.NFe);
  const inf = no(nfe.infNFe);
  if (!Object.keys(inf).length) throw new ErroNfe('O arquivo não parece ser uma NF-e.');

  const ide = no(inf.ide);
  const emit = no(inf.emit);
  const dest = no(inf.dest);
  const total = no(no(inf.total).ICMSTot);
  const chave =
    texto(no(no(proc.protNFe).infProt).chNFe) ?? texto(inf['@_Id'])?.replace(/^NFe/, '') ?? '';
  const dhEmi = texto(ide.dhEmi) ?? (texto(ide.dEmi) ? `${texto(ide.dEmi)}T00:00:00-03:00` : '');

  const dets = Array.isArray(inf.det) ? inf.det : [];
  const itens = dets.map((d, i) => {
    const det = no(d);
    const prod = no(det.prod);
    const ean = texto(prod.cEAN) ?? texto(prod.cEANTrib);
    return {
      numeroItem: Number(texto(det['@_nItem']) ?? i + 1),
      descricao: texto(prod.xProd) ?? '',
      ean: ou(/^\d{8}$|^\d{12,14}$/, ean),
      ncm: ou(/^\d{8}$/, texto(prod.NCM)),
      cfop: ou(/^\d{4}$/, texto(prod.CFOP)),
      quantidade: numero(prod.qCom),
      unidade: (texto(prod.uCom) ?? 'UN').slice(0, 6),
      valorUnitario: numero(prod.vUnCom),
      valorTotal: numero(prod.vProd),
    };
  });

  const r = notaSchema.safeParse({
    chave,
    numero: texto(ide.nNF) ?? '',
    serie: texto(ide.serie) ?? '',
    emitidaEm: dhEmi,
    emitente: {
      documento: texto(emit.CNPJ) ?? texto(emit.CPF) ?? '',
      nome: texto(emit.xNome) ?? '',
      uf: ou(/^[A-Z]{2}$/, texto(no(emit.enderEmit).UF)),
    },
    destinatario: Object.keys(dest).length
      ? {
          documento: ou(/^\d{11}$|^\d{14}$/, texto(dest.CNPJ) ?? texto(dest.CPF)),
          nome: texto(dest.xNome),
        }
      : null,
    valorTotal: numero(total.vNF),
    itens,
  });
  if (!r.success) {
    const campo = r.error.issues[0]?.path.join('.') ?? '';
    throw new ErroNfe(`A nota tem um campo fora do padrão (${campo || 'estrutura'}).`);
  }
  return r.data;
}
