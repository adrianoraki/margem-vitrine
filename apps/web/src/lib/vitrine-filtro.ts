import { TERMOS_ALIMENTOS, termosCasados } from '@margem/core/pncp';

// O catálogo é pensado para objetos de licitação (plural: "frutas"); itens vêm no singular.
const TERMOS_VITRINE = [...TERMOS_ALIMENTOS, 'fruta', 'legume', 'verdura', 'hortalica'];

/** Abaixo disso o "preço" quase sempre é percentual de desconto lançado no campo de valor. */
export const PRECO_MINIMO_VITRINE = 0.5;

/**
 * Diz se um preço homologado serve de exemplo na vitrine: item de alimento e valor plausível.
 * @param descricao Descrição do item, como veio do PNCP.
 * @param valor Valor unitário homologado, em reais.
 */
export function ehPrecoDeVitrine(descricao: string, valor: number): boolean {
  return valor >= PRECO_MINIMO_VITRINE && termosCasados(descricao, TERMOS_VITRINE).length > 0;
}
