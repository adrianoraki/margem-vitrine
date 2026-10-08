import type { ClienteMargem } from '@margem/core/supabase';
import type { LinhaItem, LinhaResultado } from '@margem/core/pncp';
import type { Repositorio } from './tipos';

function falhou(onde: string, error: { message: string } | null) {
  if (error) throw new Error(`${onde}: ${error.message}`);
}

/**
 * Repositório real, com cliente service role (roda só no GitHub Actions).
 * Upserts idempotentes: rodar de novo a mesma janela não duplica nada.
 */
export function repositorioSupabase(sb: ClienteMargem): Repositorio {
  const licita = sb.schema('licita');

  async function gravarItensEResultados(itens: LinhaItem[], resultados: LinhaResultado[]) {
    if (itens.length) {
      const { error } = await licita
        .from('itens')
        .upsert(itens, { onConflict: 'numero_controle_pncp,numero_item' });
      falhou('itens', error);
    }
    if (resultados.length) {
      const { error } = await licita.from('resultados').upsert(resultados, {
        onConflict: 'numero_controle_pncp,numero_item,sequencial_resultado',
      });
      falhou('resultados', error);
    }
  }

  return {
    async salvarContratacao(c, itens, resultados) {
      const { error } = await licita
        .from('contratacoes')
        .upsert(c, { onConflict: 'numero_controle_pncp' });
      falhou('contratacoes', error);
      await gravarItensEResultados(itens, resultados);
    },

    async salvarResultadosRevisita(_numeroControle, itens, resultados) {
      await gravarItensEResultados(itens, resultados);
    },

    async pendentesDeResultado(limite) {
      const agora = new Date();
      const { data, error } = await licita
        .from('contratacoes')
        .select(
          'numero_controle_pncp, orgao_cnpj, ano_compra, sequencial_compra, objeto, termos_casados',
        )
        .lt('data_encerramento_proposta', agora.toISOString())
        .gt(
          'data_encerramento_proposta',
          new Date(agora.getTime() - 120 * 86_400_000).toISOString(),
        )
        .is('valor_total_homologado', null)
        .order('atualizado_em', { ascending: true })
        .limit(limite);
      falhou('pendentes', error);
      return data ?? [];
    },

    async marcarRevisitada(numeroControle) {
      const { error } = await licita
        .from('contratacoes')
        .update({ atualizado_em: new Date().toISOString() })
        .eq('numero_controle_pncp', numeroControle);
      falhou('marcar revisita', error);
    },

    async iniciarLog(job) {
      const { data, error } = await sb
        .schema('core')
        .from('log_jobs')
        .insert({ job })
        .select('id')
        .single();
      falhou('log_jobs', error);
      return data?.id ?? null;
    },

    async terminarLog(id, status, detalhes) {
      if (id === null) return;
      const { error } = await sb
        .schema('core')
        .from('log_jobs')
        .update({ status, detalhes: detalhes as never, terminado_em: new Date().toISOString() })
        .eq('id', id);
      falhou('log_jobs fim', error);
    },
  };
}
