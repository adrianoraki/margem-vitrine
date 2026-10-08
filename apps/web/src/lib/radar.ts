import 'server-only';
import { UFS_NORDESTE } from '@margem/core/pncp';
import type { Regra } from './sessao';
import type { supabaseServidor } from './supabase-servidor';

type Cliente = NonNullable<Awaited<ReturnType<typeof supabaseServidor>>>;

export interface Oportunidade {
  numero_controle_pncp: string;
  orgao_razao_social: string;
  municipio: string | null;
  uf: string;
  objeto: string;
  modalidade_nome: string | null;
  valor_total_estimado: number | null;
  data_encerramento_proposta: string | null;
  termos_casados: string[];
}

const COLUNAS =
  'numero_controle_pncp, orgao_razao_social, municipio, uf, objeto, modalidade_nome, valor_total_estimado, data_encerramento_proposta, termos_casados';

/**
 * Licitações abertas que casam com o radar: algum termo em comum e UF escolhida
 * (sem UF escolhida, vale o Nordeste inteiro). Ordena pelo prazo mais curto.
 * @param sb Cliente com a sessão do usuário.
 * @param regra Radar ativo da empresa.
 * @param opcoes `encerradas` traz as já fechadas (mais recentes primeiro), úteis pelo preço vencedor.
 */
export async function buscarOportunidades(
  sb: Cliente,
  regra: Regra,
  { limite = 50, encerradas = false }: { limite?: number; encerradas?: boolean } = {},
): Promise<{ lista: Oportunidade[]; total: number }> {
  const ufs = regra.ufs.length ? regra.ufs : [...UFS_NORDESTE];
  const agora = new Date().toISOString();
  let q = sb
    .schema('licita')
    .from('contratacoes')
    .select(COLUNAS, { count: 'exact' })
    .in('uf', ufs)
    .order('data_encerramento_proposta', { ascending: !encerradas, nullsFirst: false })
    .limit(limite);
  q = encerradas
    ? q.lte('data_encerramento_proposta', agora)
    : q.gt('data_encerramento_proposta', agora);
  if (regra.termos.length) q = q.overlaps('termos_casados', regra.termos);
  const { data, count } = await q;
  return { lista: (data ?? []) as Oportunidade[], total: count ?? 0 };
}

/** Uma licitação pelo número de controle do PNCP, com os itens. */
export async function carregarLicitacao(sb: Cliente, id: string) {
  const [c, itens] = await Promise.all([
    sb
      .schema('licita')
      .from('contratacoes')
      .select(`${COLUNAS}, unidade_nome, numero_compra, link_sistema_origem, data_publicacao`)
      .eq('numero_controle_pncp', id)
      .maybeSingle(),
    sb
      .schema('licita')
      .from('itens')
      .select(
        'numero_item, descricao, quantidade, unidade_medida, valor_unitario_estimado, termos_casados',
      )
      .eq('numero_controle_pncp', id)
      .order('numero_item')
      .limit(300),
  ]);
  return { contratacao: c.data, itens: itens.data ?? [] };
}

/**
 * Preços homologados recentes de itens com algum dos termos, para a referência de preço.
 * Só PJ: CPF de fornecedor pessoa física nem chega a ser lido.
 */
export async function precosHomologados(sb: Cliente, termos: string[]) {
  if (!termos.length) return [];
  const { data } = await sb
    .schema('licita')
    .from('resultados')
    .select('valor_unitario_homologado, itens!inner(termos_casados, unidade_medida)')
    .eq('tipo_pessoa', 'PJ')
    .gte('valor_unitario_homologado', 0.5)
    .overlaps('itens.termos_casados', termos)
    .order('data_resultado', { ascending: false, nullsFirst: false })
    .limit(1000);
  type Linha = {
    valor_unitario_homologado: number | null;
    itens: { termos_casados: string[]; unidade_medida: string | null };
  };
  return ((data ?? []) as unknown as Linha[]).map((l) => ({
    valor: Number(l.valor_unitario_homologado),
    termos: l.itens.termos_casados,
    unidade: l.itens.unidade_medida,
  }));
}
