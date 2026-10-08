import { z } from 'zod';

// Schemas da API pública do PNCP (https://pncp.gov.br/api/consulta/swagger-ui/index.html).
// Toda resposta do PNCP passa por aqui antes de tocar no banco. Os objetos são abertos
// (campos extras são ignorados) porque a API acrescenta campos sem aviso; os campos que
// usamos são obrigatórios ou explicitamente opcionais.

/** Número que às vezes vem como string. Vazio/nulo vira null. */
const numero = z.preprocess((v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string') return Number(v.replace(',', '.'));
  return v;
}, z.number().finite().nullable());

const textoOpcional = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim() : null));

/**
 * Data do PNCP. A API devolve horário de Brasília sem fuso ("2026-08-01T10:00:00").
 * Normalizamos para ISO com -03:00 para o banco (timestamptz) não interpretar como UTC.
 */
export const dataPncpSchema = z
  .string()
  .nullish()
  .transform((v, ctx) => {
    if (!v) return null;
    const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(v);
    const iso = temFuso ? v : `${v.length === 10 ? `${v}T00:00:00` : v}-03:00`;
    if (Number.isNaN(Date.parse(iso))) {
      ctx.addIssue({ code: 'custom', message: `data inválida: ${v}` });
      return z.NEVER;
    }
    return iso;
  });

/** Contratação de /contratacoes/publicacao. Datas normalizadas para ISO com fuso de Brasília. */
export const contratacaoPncpSchema = z.object({
  numeroControlePNCP: z.string().min(1),
  anoCompra: z.coerce.number().int(),
  sequencialCompra: z.coerce.number().int(),
  numeroCompra: textoOpcional,
  processo: textoOpcional,
  orgaoEntidade: z.object({
    cnpj: z.string().regex(/^\d{14}$/),
    razaoSocial: z.string().min(1),
  }),
  unidadeOrgao: z.object({
    ufSigla: z.string().length(2),
    municipioNome: textoOpcional,
    codigoIbge: z.coerce.string().nullish(),
    nomeUnidade: textoOpcional,
  }),
  modalidadeId: z.coerce.number().int(),
  modalidadeNome: textoOpcional,
  objetoCompra: z.string().min(1),
  valorTotalEstimado: numero.optional(),
  valorTotalHomologado: numero.optional(),
  situacaoCompraId: z.coerce.number().int().nullish(),
  situacaoCompraNome: textoOpcional,
  dataPublicacaoPncp: dataPncpSchema,
  dataAberturaProposta: dataPncpSchema,
  dataEncerramentoProposta: dataPncpSchema,
  linkSistemaOrigem: textoOpcional,
});
export type ContratacaoPncp = z.infer<typeof contratacaoPncpSchema>;

/** Envelope de paginação dos endpoints de consulta. */
export const paginaPncpSchema = z.object({
  data: z.array(z.unknown()),
  totalRegistros: z.coerce.number().int().nonnegative(),
  totalPaginas: z.coerce.number().int().nonnegative(),
  numeroPagina: z.coerce.number().int().nonnegative(),
  paginasRestantes: z.coerce.number().int().nonnegative(),
});

/** Item de /orgaos/{cnpj}/compras/{ano}/{seq}/itens. `temResultado` ausente vira false. */
export const itemPncpSchema = z.object({
  numeroItem: z.coerce.number().int().positive(),
  descricao: z.string().min(1),
  materialOuServico: z.enum(['M', 'S']).nullish(),
  quantidade: numero.optional(),
  unidadeMedida: textoOpcional,
  valorUnitarioEstimado: numero.optional(),
  valorTotal: numero.optional(),
  situacaoCompraItem: z.coerce.number().int().nullish(),
  temResultado: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false),
});
export type ItemPncp = z.infer<typeof itemPncpSchema>;

/** Resultado (vencedor e preço homologado) de um item. O CPF chega em claro: mascare antes de gravar. */
export const resultadoPncpSchema = z.object({
  sequencialResultado: z.coerce.number().int().positive().nullish(),
  niFornecedor: textoOpcional,
  tipoPessoa: z.enum(['PJ', 'PF', 'PE']).nullish(),
  nomeRazaoSocialFornecedor: textoOpcional,
  quantidadeHomologada: numero.optional(),
  valorUnitarioHomologado: numero.optional(),
  valorTotalHomologado: numero.optional(),
  dataResultado: dataPncpSchema,
});
export type ResultadoPncp = z.infer<typeof resultadoPncpSchema>;
