import {
  paraLinhaContratacao,
  paraLinhaItem,
  paraLinhaResultado,
  termosCasados,
  type ClientePncp,
  type LinhaItem,
  type LinhaResultado,
  type RefContratacao,
} from '@margem/core/pncp';
import type { Repositorio, ResumoColeta } from './tipos';

export interface OpcoesColeta {
  ufs: string[];
  modalidades: number[];
  /** Janela de publicação: de agora − dias até agora. */
  dias: number;
  /** Quantas contratações encerradas revisitar por execução para buscar resultado. */
  revisitar: number;
  agora?: Date;
  termos?: readonly string[];
}

/** Executa tarefas com no máximo `n` em paralelo (educado com a API pública). */
async function emParalelo<T, R>(itens: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const saida: R[] = new Array(itens.length);
  let proximo = 0;
  const trabalhadores = Array.from({ length: Math.min(n, itens.length) }, async () => {
    while (proximo < itens.length) {
      const i = proximo++;
      saida[i] = await fn(itens[i] as T);
    }
  });
  await Promise.all(trabalhadores);
  return saida;
}

async function itensEResultados(
  pncp: ClientePncp,
  numeroControle: string,
  ref: RefContratacao,
  termos: readonly string[] | undefined,
): Promise<{ itens: LinhaItem[]; resultados: LinhaResultado[] }> {
  const itens = (await pncp.itens(ref)).map((i) =>
    paraLinhaItem(numeroControle, i, termosCasados(i.descricao, termos)),
  );
  const comResultado = itens.filter((i) => i.tem_resultado);
  const listas = await emParalelo(comResultado, 3, async (i) =>
    (await pncp.resultados(ref, i.numero_item)).map((r, idx) =>
      paraLinhaResultado(numeroControle, i.numero_item, r, idx),
    ),
  );
  return { itens, resultados: listas.flat() };
}

/**
 * Uma execução do coletor: (1) contratações publicadas na janela, filtradas pelo catálogo de alimentos,
 * com itens e resultados; (2) revisita contratações já encerradas para capturar o preço homologado,
 * que só aparece semanas depois da publicação.
 * Erro numa contratação não derruba a execução: vai para `erros` e o log.
 */
export async function coletar(
  pncp: ClientePncp,
  repo: Repositorio,
  opcoes: OpcoesColeta,
  resumo: ResumoColeta,
): Promise<ResumoColeta> {
  const agora = opcoes.agora ?? new Date();
  const inicio = new Date(agora.getTime() - opcoes.dias * 86_400_000);

  for (const uf of opcoes.ufs) {
    for (const modalidade of opcoes.modalidades) {
      for await (const pagina of pncp.todasContratacoesPublicadas({
        dataInicial: inicio,
        dataFinal: agora,
        modalidade,
        uf,
      })) {
        resumo.paginasLidas++;
        resumo.contratacoesVistas += pagina.contratacoes.length;
        const deAlimentos = pagina.contratacoes
          .map((c) => ({ c, termos: termosCasados(c.objetoCompra, opcoes.termos) }))
          .filter((x) => x.termos.length > 0);

        await emParalelo(deAlimentos, 2, async ({ c, termos }) => {
          try {
            const ref = {
              cnpj: c.orgaoEntidade.cnpj,
              ano: c.anoCompra,
              sequencial: c.sequencialCompra,
            };
            const { itens, resultados } = await itensEResultados(
              pncp,
              c.numeroControlePNCP,
              ref,
              opcoes.termos,
            );
            const todosTermos = [
              ...new Set([...termos, ...itens.flatMap((i) => i.termos_casados)]),
            ];
            await repo.salvarContratacao(paraLinhaContratacao(c, todosTermos), itens, resultados);
            resumo.contratacoesDeAlimentos++;
            resumo.itensGravados += itens.length;
            resumo.resultadosGravados += resultados.length;
          } catch (e) {
            resumo.erros.push(
              `${c.numeroControlePNCP}: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        });
      }
    }
  }

  const pendentes = await repo.pendentesDeResultado(opcoes.revisitar);
  for (const p of pendentes) {
    try {
      const ref = { cnpj: p.orgao_cnpj, ano: p.ano_compra, sequencial: p.sequencial_compra };
      const { itens, resultados } = await itensEResultados(
        pncp,
        p.numero_controle_pncp,
        ref,
        opcoes.termos,
      );
      if (resultados.length > 0) {
        await repo.salvarResultadosRevisita(p.numero_controle_pncp, itens, resultados);
        resumo.resultadosGravados += resultados.length;
      }
      await repo.marcarRevisitada(p.numero_controle_pncp);
      resumo.revisitadas++;
    } catch (e) {
      resumo.erros.push(
        `revisita ${p.numero_controle_pncp}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return resumo;
}

/** Resumo zerado. */
export function novoResumo(): ResumoColeta {
  return {
    paginasLidas: 0,
    contratacoesVistas: 0,
    contratacoesDeAlimentos: 0,
    itensGravados: 0,
    resultadosGravados: 0,
    revisitadas: 0,
    registrosInvalidos: 0,
    erros: [],
  };
}
