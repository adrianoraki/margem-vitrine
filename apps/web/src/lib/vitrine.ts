import 'server-only';
import { UFS_NORDESTE } from '@margem/core/pncp';
import { supabasePublico } from './supabase';
import { capitalizarNome, limparObjeto, nomeItem, nomeOrgao } from './texto';
import { ehPrecoDeVitrine, PRECO_MINIMO_VITRINE } from './vitrine-filtro';

export interface Destaque {
  orgao: string;
  municipio: string;
  uf: string;
  objeto: string;
  valorEstimado: number | null;
  encerramento: string;
  modalidade: string | null;
}

export interface PrecoRecente {
  item: string;
  unidade: string | null;
  valor: number;
  municipio: string;
  uf: string;
}

/** O que a landing mostra de dado real. Tudo pode faltar: a página se adapta, nunca inventa. */
export interface Vitrine {
  abertas: number | null;
  licitacoes: number | null;
  precos: number | null;
  destaque: Destaque | null;
  precosRecentes: PrecoRecente[];
  atualizadoEm: string | null;
}

const VAZIA: Vitrine = {
  abertas: null,
  licitacoes: null,
  precos: null,
  destaque: null,
  precosRecentes: [],
  atualizadoEm: null,
};

/**
 * Lê os números e exemplos reais da coleta do PNCP para a landing (chave pública, RLS de leitura aberta).
 * Qualquer falha devolve o que deu para ler; a página esconde o que faltar.
 */
export async function carregarVitrine(): Promise<Vitrine> {
  const sb = supabasePublico();
  if (!sb) return VAZIA;
  const licita = sb.schema('licita');
  const agora = new Date().toISOString();

  const [abertas, licitacoes, precos, destaque, recentes, ultima] = await Promise.all([
    licita
      .from('contratacoes')
      .select('numero_controle_pncp', { count: 'exact', head: true })
      .in('uf', [...UFS_NORDESTE])
      .gt('data_encerramento_proposta', agora),
    licita.from('contratacoes').select('numero_controle_pncp', { count: 'exact', head: true }),
    licita.from('resultados').select('numero_controle_pncp', { count: 'exact', head: true }),
    licita
      .from('contratacoes')
      .select(
        'orgao_razao_social, municipio, uf, objeto, valor_total_estimado, data_encerramento_proposta, modalidade_nome',
      )
      .in('uf', [...UFS_NORDESTE])
      .gt('data_encerramento_proposta', agora)
      .order('valor_total_estimado', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    licita
      .from('resultados')
      .select(
        'valor_unitario_homologado, itens!inner(descricao, unidade_medida, contratacoes!inner(municipio, uf))',
      )
      .gte('valor_unitario_homologado', PRECO_MINIMO_VITRINE)
      .eq('tipo_pessoa', 'PJ')
      .order('data_resultado', { ascending: false, nullsFirst: false })
      .limit(80),
    licita
      .from('contratacoes')
      .select('atualizado_em')
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const d = destaque.data;
  type LinhaPreco = {
    valor_unitario_homologado: number | null;
    itens: {
      descricao: string;
      unidade_medida: string | null;
      contratacoes: { municipio: string | null; uf: string };
    };
  };
  // Só alimento com preço plausível, e um preço por produto, para a vitrine não repetir.
  const vistos = new Set<string>();
  const precosRecentes: PrecoRecente[] = [];
  for (const r of (recentes.data ?? []) as unknown as LinhaPreco[]) {
    const valor = Number(r.valor_unitario_homologado);
    if (!ehPrecoDeVitrine(r.itens.descricao, valor)) continue;
    const item = nomeItem(r.itens.descricao);
    const chave = item.toLowerCase().split(' ').slice(0, 2).join(' ');
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    precosRecentes.push({
      item,
      unidade: r.itens.unidade_medida,
      valor,
      municipio: capitalizarNome(r.itens.contratacoes.municipio ?? ''),
      uf: r.itens.contratacoes.uf,
    });
    if (precosRecentes.length === 3) break;
  }

  return {
    abertas: abertas.error ? null : (abertas.count ?? 0),
    licitacoes: licitacoes.error ? null : (licitacoes.count ?? 0),
    precos: precos.error ? null : (precos.count ?? 0),
    destaque:
      d && d.data_encerramento_proposta
        ? {
            orgao: nomeOrgao(d.orgao_razao_social, capitalizarNome(d.municipio ?? '')),
            municipio: capitalizarNome(d.municipio ?? ''),
            uf: d.uf,
            objeto: limparObjeto(d.objeto),
            valorEstimado: d.valor_total_estimado === null ? null : Number(d.valor_total_estimado),
            encerramento: d.data_encerramento_proposta,
            modalidade: d.modalidade_nome,
          }
        : null,
    precosRecentes,
    atualizadoEm: ultima.data?.atualizado_em ?? null,
  };
}
