const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
const inteiro = new Intl.NumberFormat('pt-BR');

/**
 * Formata valor em reais (R$ 1.234,56).
 * @param valor Valor numérico em reais.
 */
export function formatarMoeda(valor: number): string {
  return brl.format(valor);
}

/**
 * Formata uma fração como percentual (0,125 → "12,5%").
 * @param fracao Valor entre 0 e 1 (pode ser negativo).
 */
export function formatarPercentual(fracao: number): string {
  return pct.format(fracao);
}

/**
 * Formata inteiro com separador de milhar (1234 → "1.234").
 * @param valor Número inteiro.
 */
export function formatarInteiro(valor: number): string {
  return inteiro.format(valor);
}
