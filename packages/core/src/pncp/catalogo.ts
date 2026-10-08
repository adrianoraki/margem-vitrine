/**
 * Catálogo inicial de termos de alimentos (RF-10). Espelha licita.catalogo_termos da migration;
 * a do banco é a editável, esta é a que o coletor usa quando roda sem ler o banco.
 */
export const TERMOS_ALIMENTOS: readonly string[] = [
  'generos alimenticios',
  'alimentacao escolar',
  'merenda',
  'arroz',
  'feijao',
  'macarrao',
  'farinha',
  'flocos de milho',
  'fuba',
  'acucar',
  'cafe',
  'oleo de soja',
  'sal refinado',
  'leite',
  'queijo',
  'iogurte',
  'manteiga',
  'carne',
  'frango',
  'peixe',
  'ovos',
  'charque',
  'hortifruti',
  'hortifrutigranjeiros',
  'frutas',
  'verduras',
  'legumes',
  'polpa de fruta',
  'pao',
  'biscoito',
];

/**
 * Normaliza texto para comparação: minúsculas, sem acento, espaços simples.
 * @param texto Texto livre (objeto da licitação, descrição de item).
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const cacheRegex = new Map<string, RegExp>();
function regexDoTermo(termo: string): RegExp {
  let r = cacheRegex.get(termo);
  if (!r) {
    const t = normalizarTexto(termo).replace(/ /g, '\\s+');
    // Palavra inteira, aceitando plural regular (carne/carnes, feijao/feijoes não: use o termo no singular).
    r = new RegExp(`(?:^|\\s)${t}(?:s|es)?(?=\\s|$)`);
    cacheRegex.set(termo, r);
  }
  return r;
}

/**
 * Diz quais termos do catálogo aparecem no texto, como palavra inteira.
 * @param texto Objeto ou descrição, em qualquer caixa e com acento.
 * @param termos Catálogo a usar (padrão: TERMOS_ALIMENTOS).
 * @returns Termos casados, na ordem do catálogo, sem repetição.
 */
export function termosCasados(
  texto: string,
  termos: readonly string[] = TERMOS_ALIMENTOS,
): string[] {
  const alvo = normalizarTexto(texto);
  if (!alvo) return [];
  return termos.filter((t) => regexDoTermo(t).test(alvo));
}
