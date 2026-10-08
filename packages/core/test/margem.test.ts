import { describe, expect, it } from 'vitest';
import { calcularMargem, classificarMargem } from '../src/margem';
import { formatarMoeda, formatarPercentual } from '../src/moeda';

describe('margem estimada (RF-31)', () => {
  it('calcula (preço − custo) ÷ preço e forma a faixa', () => {
    const f = calcularMargem({
      precoVencedorMedio: 100,
      custoMedio: 80,
      custoMinimo: 75,
      custoMaximo: 90,
    });
    expect(f).toEqual({ minima: 0.1, central: 0.2, maxima: 0.25 });
  });
  it('sem preço vencedor positivo não há margem', () => {
    expect(calcularMargem({ precoVencedorMedio: 0, custoMedio: 10 })).toBeNull();
    expect(calcularMargem({ precoVencedorMedio: 10, custoMedio: Number.NaN })).toBeNull();
  });
  it('classifica nos limiares da Tela 2', () => {
    expect(classificarMargem(0.16)).toBe('positiva');
    expect(classificarMargem(0.15)).toBe('apertada');
    expect(classificarMargem(0.05)).toBe('apertada');
    expect(classificarMargem(0.049)).toBe('negativa');
    expect(classificarMargem(-0.2)).toBe('negativa');
  });
  it('formata em pt-BR', () => {
    expect(formatarMoeda(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
    expect(formatarPercentual(0.125)).toBe('12,5%');
  });
});
