/**
 * Limpa o objeto de uma licitação para exibição: tira prefixos de portal
 * ("[Portal de Compras Públicas] - ") e desfaz CAIXA ALTA gritada.
 * @param objeto Texto como veio do PNCP.
 */
export function limparObjeto(objeto: string): string {
  let t = objeto
    .replace(/^\s*\[[^\]]*\]\s*[-–—:]?\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const letras = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
  const maiusculas = t.replace(/[^A-ZÀ-Þ]/g, '');
  if (letras.length > 0 && maiusculas.length / letras.length > 0.5) t = t.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Nome próprio de município/órgão vindo em caixa alta ("MUNICIPIO DE PATOS" → "Município de Patos").
 * @param nome Texto em qualquer caixa.
 */
export function capitalizarNome(nome: string): string {
  const minusculas = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  return nome
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ')
    .replace(/^Municipio\b/, 'Município');
}

const compacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * Valor em reais compacto para cards (R$ 1,1 mi; R$ 732,1 mil).
 * @param valor Valor em reais.
 */
export function moedaCompacta(valor: number): string {
  return compacta.format(valor).replace(/\s/g, ' ');
}

/**
 * Prazo até o encerramento das propostas, em linguagem de gente.
 * @param encerramento Data ISO do encerramento.
 * @param agora Referência (injetável para teste).
 * @returns Texto ("encerra hoje", "em 1 dia", "em 8 dias") e se é urgente (< 48 h).
 */
export function prazoAte(
  encerramento: string,
  agora = new Date(),
): { texto: string; urgente: boolean } {
  const ms = new Date(encerramento).getTime() - agora.getTime();
  const horas = ms / 3_600_000;
  if (horas <= 0) return { texto: 'encerrada', urgente: false };
  if (horas < 24) return { texto: `encerra em ${Math.max(1, Math.round(horas))} h`, urgente: true };
  const dias = Math.round(horas / 24);
  return { texto: `em ${dias} ${dias === 1 ? 'dia' : 'dias'}`, urgente: horas < 48 };
}

/**
 * Nome do órgão para exibição. Quando o órgão é o próprio município ("MUNICIPIO DE X"),
 * vira "Prefeitura de X" com a grafia do campo município (que traz acento), sem repetir o nome.
 * @param orgao Razão social do órgão, como veio do PNCP.
 * @param municipio Nome do município da unidade.
 */
export function nomeOrgao(orgao: string, municipio: string): string {
  if (/^munic[ií]pio\s+de\s+/i.test(orgao) && municipio) return `Prefeitura de ${municipio}`;
  return capitalizarNome(orgao);
}

// Categorias do catálogo do PNCP que não dizem o produto: o nome real vem no atributo ("tipo: banana").
const CATEGORIA_GENERICA =
  /^(fruta|legume|verdura|hortali[cç]a|leguminosa|condimento|tempero|cereal)s?\b/i;
const ATRIBUTOS_DO_PRODUTO = ['variedade', 'espécie', 'especie', 'tipo'];

/**
 * Nome curto de um item para a vitrine. O PNCP descreve itens de catálogo como
 * "Categoria Em Maiúsculas atributo: valor, atributo: valor"; o nome é a categoria,
 * ou o valor de variedade/espécie/tipo quando a categoria é genérica ("Fruta … tipo: acerola" → "Acerola").
 * @param descricao Descrição do item, como veio do PNCP.
 */
export function nomeItem(descricao: string): string {
  const d = descricao.replace(/\s+/g, ' ').trim();
  if (!d.includes(':')) return limparObjeto(d.split(/[,(]/)[0]?.trim() ?? d);

  const cabeca: string[] = [];
  for (const p of d.split(' ')) {
    if (!/^[A-ZÀ-Þ]/.test(p)) break;
    cabeca.push(p.replace(/[*:,]+$/, ''));
    if (/[:,]$/.test(p)) break;
  }
  const categoria = cabeca
    .join(' ')
    .replace(/\s+in natura$/i, '')
    .toLowerCase();

  if (!categoria || CATEGORIA_GENERICA.test(categoria)) {
    for (const atributo of ATRIBUTOS_DO_PRODUTO) {
      const valor = new RegExp(`(?:^|[\\s,])${atributo}:\\s*([^,]+)`, 'i')
        .exec(d)?.[1]
        ?.split(' / ')[0]
        ?.trim();
      if (valor && !/^(tipo\b|\d)/i.test(valor)) return primeiraMaiuscula(valor);
    }
  }
  return primeiraMaiuscula(categoria || d);
}

function primeiraMaiuscula(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
