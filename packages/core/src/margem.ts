/** Faixa de margem estimada. Nunca é promessa: sempre mostrada como intervalo (RF-31). */
export interface FaixaMargem {
  /** Margem com o custo mais alto do período. */
  minima: number;
  /** Margem com o custo médio. */
  central: number;
  /** Margem com o custo mais baixo do período. */
  maxima: number;
}

export interface EntradaMargem {
  /** Preço vencedor médio da região, na unidade da licitação. */
  precoVencedorMedio: number;
  /** Custo médio dos últimos 60 dias, já convertido para a unidade da licitação. */
  custoMedio: number;
  /** Menor e maior custo unitário no mesmo período, para formar a faixa. */
  custoMinimo?: number;
  custoMaximo?: number;
}

/**
 * Calcula a margem estimada (RF-31): (preço vencedor médio − custo) ÷ preço vencedor médio.
 * @returns A faixa de margem, ou null quando não há preço vencedor positivo para dividir.
 */
export function calcularMargem(entrada: EntradaMargem): FaixaMargem | null {
  const { precoVencedorMedio: p, custoMedio } = entrada;
  if (!(p > 0) || !Number.isFinite(custoMedio) || custoMedio < 0) return null;
  const m = (custo: number) => (p - custo) / p;
  return {
    minima: m(entrada.custoMaximo ?? custoMedio),
    central: m(custoMedio),
    maxima: m(entrada.custoMinimo ?? custoMedio),
  };
}

export type ClasseMargem = 'positiva' | 'apertada' | 'negativa';

/**
 * Classe visual da margem (Tela 2): acima de 15% accent, 5–15% warning, abaixo de 5% critical.
 * @param margem Fração (0,2 = 20%).
 */
export function classificarMargem(margem: number): ClasseMargem {
  if (margem > 0.15) return 'positiva';
  if (margem >= 0.05) return 'apertada';
  return 'negativa';
}
