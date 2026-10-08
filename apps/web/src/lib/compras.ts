import 'server-only';
import type { supabaseServidor } from './supabase-servidor';

type Cliente = NonNullable<Awaited<ReturnType<typeof supabaseServidor>>>;

/** Planos que incluem o Margem Compras (notas, custos e margem). */
export const PLANOS_COMPRAS = ['compras_pro', 'completo'] as const;

/**
 * Plano dá direito ao Margem Compras?
 * @param plano Plano da assinatura (core.plano).
 */
export function temCompras(plano: string | null): boolean {
  return (PLANOS_COMPRAS as readonly string[]).includes(plano ?? '');
}

export interface Custo {
  produto_id: string;
  nome: string;
  unidade: string;
  compras: number;
  quantidade: number;
  custo_medio: number;
  custo_minimo: number;
  custo_maximo: number;
  ultimo_custo: number;
  ultima_compra: string;
}

/**
 * Custo por produto no período (compras.custos_produtos, com a RLS de quem chama).
 * @param dias Janela em dias (padrão 60, a do cálculo de margem RF-31).
 */
export async function custosDaEmpresa(
  sb: Cliente,
  organizacao: string,
  dias = 60,
): Promise<Custo[]> {
  const { data } = await sb
    .schema('compras')
    .rpc('custos_produtos', { p_organizacao: organizacao, p_dias: dias });
  return ((data ?? []) as Custo[]).map((c) => ({
    ...c,
    custo_medio: Number(c.custo_medio),
    custo_minimo: Number(c.custo_minimo),
    custo_maximo: Number(c.custo_maximo),
    ultimo_custo: Number(c.ultimo_custo),
    quantidade: Number(c.quantidade),
  }));
}

/** Tudo que a tela de Compras mostra: certificado ativo, notas recentes, custos. */
export async function carregarCompras(sb: Cliente, organizacao: string) {
  const [cert, notas, total, custos] = await Promise.all([
    sb
      .schema('compras')
      .from('certificados')
      .select('id, cnpj, titular_nome, valido_ate, criado_em')
      .eq('organizacao_id', organizacao)
      .is('revogado_em', null)
      .maybeSingle(),
    sb
      .schema('compras')
      .from('notas')
      .select(
        'id, numero, serie, emitida_em, valor_total, origem, fornecedores(nome), itens_compra(count)',
      )
      .eq('organizacao_id', organizacao)
      .order('emitida_em', { ascending: false })
      .limit(15),
    sb
      .schema('compras')
      .from('notas')
      .select('id', { count: 'exact', head: true })
      .eq('organizacao_id', organizacao),
    custosDaEmpresa(sb, organizacao, 3650),
  ]);
  type LinhaNota = {
    id: string;
    numero: string | null;
    serie: string | null;
    emitida_em: string;
    valor_total: number;
    origem: string;
    fornecedores: { nome: string } | null;
    itens_compra: { count: number }[];
  };
  return {
    certificado: cert.data,
    notas: (notas.data ?? []) as unknown as LinhaNota[],
    totalNotas: total.count ?? 0,
    custos,
  };
}
