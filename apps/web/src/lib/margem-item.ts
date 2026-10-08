import { calcularMargem, type FaixaMargem } from '@margem/core';
import { normalizarTexto, termosCasados } from '@margem/core/pncp';

export interface CustoProduto {
  produto_id: string;
  nome: string;
  unidade: string;
  compras: number;
  custo_medio: number;
  custo_minimo: number;
  custo_maximo: number;
}

export interface Vinculo {
  produto_id: string;
  fator_conversao: number;
}

export interface CustoDoItem {
  produto: CustoProduto;
  /** Custo na unidade da licitação: custo do produto × fator de conversão. */
  medio: number;
  minimo: number;
  maximo: number;
  fator: number;
  /** true quando veio do casamento automático por termo, sem vínculo confirmado. */
  sugerido: boolean;
}

/**
 * Chave do vínculo entre item de licitação e produto: a descrição normalizada.
 * @param descricao Descrição do item como veio do PNCP.
 */
export function chaveVinculo(descricao: string): string {
  return normalizarTexto(descricao).slice(0, 300);
}

/**
 * Custo de um item da licitação. Vínculo confirmado vence; sem ele, sugere o produto comprado
 * mais vezes que tenha um termo do catálogo em comum com o item.
 */
export function custoDoItem(
  item: { descricao: string; termos_casados: string[] },
  vinculos: Map<string, Vinculo>,
  custos: CustoProduto[],
): CustoDoItem | null {
  const v = vinculos.get(chaveVinculo(item.descricao));
  if (v) {
    const p = custos.find((c) => c.produto_id === v.produto_id);
    return p ? montar(p, v.fator_conversao, false) : null;
  }
  if (!item.termos_casados.length) return null;
  const candidatos = custos
    .filter((c) => termosCasados(c.nome).some((t) => item.termos_casados.includes(t)))
    .sort((a, b) => b.compras - a.compras);
  return candidatos[0] ? montar(candidatos[0], 1, true) : null;
}

function montar(p: CustoProduto, fator: number, sugerido: boolean): CustoDoItem {
  return {
    produto: p,
    medio: p.custo_medio * fator,
    minimo: p.custo_minimo * fator,
    maximo: p.custo_maximo * fator,
    fator,
    sugerido,
  };
}

/**
 * Margem do item: sobre a referência de preço vencedor quando há; senão, sobre o vencedor do
 * próprio certame; senão, sobre o estimado do órgão.
 */
export function margemDoItem(
  custo: CustoDoItem | null,
  precos: { referencia?: number | null; vencedor?: number | null; estimado?: number | null },
): { faixa: FaixaMargem; base: 'referência' | 'vencedor' | 'estimado' } | null {
  if (!custo) return null;
  const [base, preco] = precos.referencia
    ? (['referência', precos.referencia] as const)
    : precos.vencedor
      ? (['vencedor', precos.vencedor] as const)
      : (['estimado', precos.estimado ?? 0] as const);
  const faixa = calcularMargem({
    precoVencedorMedio: preco,
    custoMedio: custo.medio,
    custoMinimo: custo.minimo,
    custoMaximo: custo.maximo,
  });
  return faixa ? { faixa, base } : null;
}
