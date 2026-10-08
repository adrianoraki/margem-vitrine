import { describe, expect, it, vi } from 'vitest';
import { chaveReferencia, mediana, referenciasPorTermo } from '@/lib/precos';
import { rotuloCategoria, rotuloTermo } from '@/lib/termos';

vi.mock('server-only', () => ({}));

describe('preço de referência', () => {
  it('mediana resiste a outlier', () => {
    expect(mediana([])).toBeNull();
    expect(mediana([5])).toBe(5);
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([1, 2, 3, 100])).toBe(2.5);
  });
  it('agrupa por termo e unidade, e ignora percentual lançado como preço', () => {
    const refs = referenciasPorTermo([
      { valor: 6.2, termos: ['feijao'], unidade: 'Quilograma' },
      { valor: 6.4, termos: ['feijao'], unidade: 'quilograma ' },
      { valor: 30, termos: ['feijao'], unidade: 'Fardo 30 KG' },
      { valor: 0.07, termos: ['feijao'], unidade: 'Quilograma' },
    ]);
    expect(refs.get(chaveReferencia('feijao', 'QUILOGRAMA'))).toEqual({
      mediana: 6.300000000000001,
      minimo: 6.2,
      maximo: 6.4,
      amostras: 2,
    });
    expect(refs.get(chaveReferencia('feijao', 'Fardo 30 KG'))?.amostras).toBe(1);
    expect(chaveReferencia('farinha', 'Embalagem 500.0 G')).toBe(
      chaveReferencia('farinha', 'Embalagem 500 G'),
    );
  });
});

describe('rótulos do catálogo', () => {
  it('devolve a grafia com acento', () => {
    expect(rotuloTermo('feijao')).toBe('Feijão');
    expect(rotuloTermo('arroz')).toBe('Arroz');
    expect(rotuloCategoria('graos')).toBe('Grãos e farinhas');
  });
});

describe('CNPJ na Receita', () => {
  it('mapeia a resposta da BrasilAPI para o formulário', async () => {
    const { mapearCnpj } = await import('@/lib/brasilapi');
    expect(
      mapearCnpj({
        razao_social: 'COMERCIAL DE ALIMENTOS EXEMPLO LTDA ',
        nome_fantasia: 'EXEMPLO ALIMENTOS',
        cnae_fiscal: 4639701,
        uf: 'pb',
        municipio: 'CAMPINA GRANDE',
      }),
    ).toEqual({
      razaoSocial: 'COMERCIAL DE ALIMENTOS EXEMPLO LTDA',
      nomeFantasia: 'Exemplo Alimentos',
      cnae: '4639701',
      uf: 'PB',
      municipio: 'Campina Grande',
    });
  });
});
