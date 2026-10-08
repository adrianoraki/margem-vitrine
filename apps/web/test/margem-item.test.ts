import { describe, expect, it } from 'vitest';
import { chaveVinculo, custoDoItem, margemDoItem, type CustoProduto } from '@/lib/margem-item';

const arroz: CustoProduto = {
  produto_id: 'p-arroz',
  nome: 'ARROZ BRANCO TIPO 1 1KG',
  unidade: 'PCT',
  compras: 4,
  custo_medio: 5,
  custo_minimo: 4.5,
  custo_maximo: 5.5,
};
const arrozPouco: CustoProduto = { ...arroz, produto_id: 'p-arroz-2', compras: 1, custo_medio: 9 };
const feijao: CustoProduto = { ...arroz, produto_id: 'p-feijao', nome: 'FEIJAO CARIOCA 1KG' };
const item = { descricao: 'Arroz beneficiado tipo 1, pacote 1 kg', termos_casados: ['arroz'] };

describe('custo do item da licitação', () => {
  it('sugere o produto mais comprado com termo em comum', () => {
    const c = custoDoItem(item, new Map(), [arrozPouco, feijao, arroz]);
    expect(c).toMatchObject({
      produto: { produto_id: 'p-arroz' },
      medio: 5,
      sugerido: true,
      fator: 1,
    });
  });
  it('vínculo confirmado vence a sugestão e aplica o fator de conversão', () => {
    const vinculos = new Map([
      [chaveVinculo(item.descricao), { produto_id: 'p-arroz-2', fator_conversao: 30 }],
    ]);
    const c = custoDoItem(item, vinculos, [arroz, arrozPouco]);
    expect(c).toMatchObject({ produto: { produto_id: 'p-arroz-2' }, medio: 270, sugerido: false });
  });
  it('sem termo em comum não inventa custo', () => {
    expect(
      custoDoItem({ descricao: 'Gás de cozinha', termos_casados: [] }, new Map(), [arroz]),
    ).toBeNull();
  });
  it('a chave do vínculo ignora caixa e acento', () => {
    expect(chaveVinculo('FEIJÃO Carioca')).toBe(chaveVinculo('feijao carioca'));
  });
});

describe('margem do item', () => {
  const custo = custoDoItem(item, new Map(), [arroz]);
  it('usa a referência quando há, e dá a faixa pelo custo mínimo e máximo', () => {
    const m = margemDoItem(custo, { referencia: 6.25, vencedor: 7, estimado: 8 });
    expect(m?.base).toBe('referência');
    expect(m?.faixa.central).toBeCloseTo(0.2);
    expect(m?.faixa.minima).toBeCloseTo(0.12);
    expect(m?.faixa.maxima).toBeCloseTo(0.28);
  });
  it('cai para o vencedor e depois para o estimado', () => {
    expect(margemDoItem(custo, { vencedor: 10 })?.base).toBe('vencedor');
    expect(margemDoItem(custo, { estimado: 10 })?.base).toBe('estimado');
    expect(margemDoItem(custo, {})).toBeNull();
    expect(margemDoItem(null, { referencia: 10 })).toBeNull();
  });
});
