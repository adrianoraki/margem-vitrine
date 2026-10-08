/**
 * Mediana de uma lista de valores (preço de referência resiste a outlier melhor que a média).
 * @param valores Números quaisquer; vazia devolve null.
 */
export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  const meio = v[m] ?? 0;
  return v.length % 2 ? meio : ((v[m - 1] ?? meio) + meio) / 2;
}

export interface Referencia {
  mediana: number;
  minimo: number;
  maximo: number;
  amostras: number;
}

/**
 * Agrupa preços homologados por termo do catálogo e unidade de medida. Unidades diferentes
 * (kg, pacote de 5 kg) não se comparam, então a chave é termo + unidade normalizada.
 * @param linhas Preço unitário, termos casados do item e unidade.
 */
export function referenciasPorTermo(
  linhas: { valor: number; termos: string[]; unidade: string | null }[],
): Map<string, Referencia> {
  const grupos = new Map<string, number[]>();
  for (const l of linhas) {
    if (!(l.valor >= 0.5)) continue; // abaixo disso é percentual de desconto lançado como preço
    for (const t of l.termos) {
      const k = chaveReferencia(t, l.unidade);
      const g = grupos.get(k) ?? [];
      g.push(l.valor);
      grupos.set(k, g);
    }
  }
  const saida = new Map<string, Referencia>();
  for (const [k, g] of grupos) {
    saida.set(k, {
      mediana: mediana(g) ?? 0,
      minimo: Math.min(...g),
      maximo: Math.max(...g),
      amostras: g.length,
    });
  }
  return saida;
}

/** Chave de agrupamento: termo + unidade em minúsculas, sem espaços repetidos nem ".0" ("500.0 G" = "500 G"). */
export function chaveReferencia(termo: string, unidade: string | null): string {
  const u = (unidade ?? '')
    .toLowerCase()
    .replace(/(\d)[.,]0+\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return `${termo}|${u}`;
}
