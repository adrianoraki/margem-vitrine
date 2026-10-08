import { UFS_NORDESTE } from '@margem/core/pncp';
import { comLimiteDeTaxa } from '@/lib/limite-taxa';
import { supabasePublico } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Contador da landing: licitações de alimentos com proposta aberta no Nordeste.
 * Resposta cacheada 5 min na CDN; o limite de taxa protege a origem.
 */
export const GET = comLimiteDeTaxa(
  { rota: 'contador', limite: 30, janelaSegundos: 60 },
  async () => {
    const sb = supabasePublico();
    if (!sb) return Response.json({ abertas: null }, { status: 200 });

    const { count, error } = await sb
      .schema('licita')
      .from('contratacoes')
      .select('numero_controle_pncp', { count: 'exact', head: true })
      .in('uf', [...UFS_NORDESTE])
      .gt('data_encerramento_proposta', new Date().toISOString());

    if (error) {
      console.error('contador: falha ao consultar', error.message);
      return Response.json({ abertas: null }, { status: 200 });
    }
    return Response.json(
      { abertas: count ?? 0, atualizadoEm: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  },
);
