import type { LinhaContratacao, LinhaItem, LinhaResultado } from '@margem/core/pncp';

/** Onde o coletor grava. Implementação real: repositorio-supabase.ts; nos testes, em memória. */
export interface Repositorio {
  salvarContratacao(
    c: LinhaContratacao,
    itens: LinhaItem[],
    resultados: LinhaResultado[],
  ): Promise<void>;
  /** Contratações já encerradas e ainda sem homologação: candidatas a ganhar resultado. */
  pendentesDeResultado(
    limite: number,
  ): Promise<
    Array<
      Pick<
        LinhaContratacao,
        | 'numero_controle_pncp'
        | 'orgao_cnpj'
        | 'ano_compra'
        | 'sequencial_compra'
        | 'objeto'
        | 'termos_casados'
      >
    >
  >;
  /** Grava itens e resultados de uma contratação que já existe no banco. */
  salvarResultadosRevisita(
    numeroControle: string,
    itens: LinhaItem[],
    resultados: LinhaResultado[],
  ): Promise<void>;
  /** Toca atualizado_em para a fila de revisita andar. */
  marcarRevisitada(numeroControle: string): Promise<void>;
  iniciarLog(job: string): Promise<number | null>;
  terminarLog(
    id: number | null,
    status: 'ok' | 'erro',
    detalhes: Record<string, unknown>,
  ): Promise<void>;
}

export interface ResumoColeta {
  paginasLidas: number;
  contratacoesVistas: number;
  contratacoesDeAlimentos: number;
  itensGravados: number;
  resultadosGravados: number;
  revisitadas: number;
  registrosInvalidos: number;
  erros: string[];
}
