import type { z } from 'zod';
import {
  contratacaoPncpSchema,
  itemPncpSchema,
  paginaPncpSchema,
  resultadoPncpSchema,
  type ContratacaoPncp,
  type ItemPncp,
  type ResultadoPncp,
} from './schemas';

/** Base da API de consulta (contratações publicadas). Pública, sem credencial. */
export const BASE_CONSULTA_PNCP = 'https://pncp.gov.br/api/consulta/v1';
/** Base da API de integração, usada só em leitura (itens e resultados). */
export const BASE_INTEGRACAO_PNCP = 'https://pncp.gov.br/api/pncp/v1';

/** Registro que veio do PNCP mas não passou no schema. Não trava a coleta; vai para o log. */
export interface RegistroInvalido {
  origem: string;
  erro: string;
}

export interface OpcoesClientePncp {
  /** fetch a usar (injetável para teste). Padrão: fetch global. */
  fetch?: typeof fetch;
  baseConsulta?: string;
  baseIntegracao?: string;
  /** Tentativas por requisição em 429/5xx/erro de rede. Padrão 4. */
  tentativas?: number;
  /** Espera base do backoff exponencial, em ms. Padrão 1000. */
  esperaBaseMs?: number;
  /** Chamado para cada registro descartado pelo schema. */
  aoRegistroInvalido?: (r: RegistroInvalido) => void;
}

export interface FiltroPublicacao {
  /** Data inicial, inclusive. */
  dataInicial: Date;
  /** Data final, inclusive. */
  dataFinal: Date;
  /** Código da modalidade (MODALIDADES). Obrigatório no endpoint do PNCP. */
  modalidade: number;
  uf?: string;
  /** 10 a 50 (limites da API). Padrão 50. */
  tamanhoPagina?: number;
}

export interface PaginaContratacoes {
  contratacoes: ContratacaoPncp[];
  numeroPagina: number;
  totalPaginas: number;
  totalRegistros: number;
}

/** Identifica uma contratação nos endpoints de integração (itens e resultados). */
export interface RefContratacao {
  cnpj: string;
  ano: number;
  sequencial: number;
}

/**
 * Formata data como yyyyMMdd no fuso de Brasília (formato dos filtros do PNCP).
 * @param data Instante qualquer.
 */
export function dataParaPncp(data: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);
  return partes.replaceAll('-', '');
}

/** Resposta de erro do PNCP (status HTTP, ou null para falha de rede). */
export class ErroPncp extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly url: string,
  ) {
    super(message);
    this.name = 'ErroPncp';
  }
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cria um cliente da API pública do PNCP, com retry, paginação e validação Zod de toda resposta.
 * Não precisa de credencial: a API de consulta é aberta.
 */
export function criarClientePncp(opcoes: OpcoesClientePncp = {}) {
  const f = opcoes.fetch ?? fetch;
  const baseConsulta = opcoes.baseConsulta ?? BASE_CONSULTA_PNCP;
  const baseIntegracao = opcoes.baseIntegracao ?? BASE_INTEGRACAO_PNCP;
  const tentativas = opcoes.tentativas ?? 4;
  const esperaBase = opcoes.esperaBaseMs ?? 1000;
  const invalido = opcoes.aoRegistroInvalido ?? (() => {});

  async function getJson(url: string): Promise<unknown> {
    let ultimoErro: unknown;
    for (let i = 0; i < tentativas; i++) {
      if (i > 0) await dormir(esperaBase * 2 ** (i - 1));
      let resp: Response;
      try {
        resp = await f(url, { headers: { accept: 'application/json' } });
      } catch (e) {
        ultimoErro = e;
        continue;
      }
      // O PNCP responde 204 quando o filtro não tem resultado.
      if (resp.status === 204) return null;
      if (resp.ok) {
        const texto = await resp.text();
        return texto ? (JSON.parse(texto) as unknown) : null;
      }
      ultimoErro = new ErroPncp(`PNCP respondeu ${resp.status}`, resp.status, url);
      if (resp.status !== 429 && resp.status < 500) throw ultimoErro;
    }
    throw ultimoErro instanceof Error
      ? ultimoErro
      : new ErroPncp('falha de rede no PNCP', null, url);
  }

  function validarLista<T>(dados: unknown[], schema: z.ZodType<T>, origem: string): T[] {
    const ok: T[] = [];
    for (const d of dados) {
      const r = schema.safeParse(d);
      if (r.success) ok.push(r.data);
      else
        invalido({
          origem,
          erro: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; '),
        });
    }
    return ok;
  }

  /**
   * Uma página de contratações publicadas no período (GET /contratacoes/publicacao).
   * @param filtro Período, modalidade e UF.
   * @param pagina Número da página, a partir de 1.
   */
  async function contratacoesPublicadas(
    filtro: FiltroPublicacao,
    pagina = 1,
  ): Promise<PaginaContratacoes> {
    const q = new URLSearchParams({
      dataInicial: dataParaPncp(filtro.dataInicial),
      dataFinal: dataParaPncp(filtro.dataFinal),
      codigoModalidadeContratacao: String(filtro.modalidade),
      pagina: String(pagina),
      tamanhoPagina: String(filtro.tamanhoPagina ?? 50),
    });
    if (filtro.uf) q.set('uf', filtro.uf);
    const url = `${baseConsulta}/contratacoes/publicacao?${q}`;
    const bruto = await getJson(url);
    if (bruto === null)
      return { contratacoes: [], numeroPagina: pagina, totalPaginas: 0, totalRegistros: 0 };
    const env = paginaPncpSchema.parse(bruto);
    return {
      contratacoes: validarLista(env.data, contratacaoPncpSchema, url),
      numeroPagina: env.numeroPagina,
      totalPaginas: env.totalPaginas,
      totalRegistros: env.totalRegistros,
    };
  }

  /**
   * Percorre todas as páginas do filtro.
   * @param filtro Período, modalidade e UF.
   * @param maxPaginas Teto de segurança. Padrão 200 (10 mil registros).
   */
  async function* todasContratacoesPublicadas(filtro: FiltroPublicacao, maxPaginas = 200) {
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      const p = await contratacoesPublicadas(filtro, pagina);
      yield p;
      if (pagina >= p.totalPaginas) return;
    }
  }

  /**
   * Itens de uma contratação (GET /orgaos/{cnpj}/compras/{ano}/{sequencial}/itens).
   * @param ref CNPJ do órgão, ano e sequencial da compra.
   */
  async function itens(ref: RefContratacao): Promise<ItemPncp[]> {
    const todos: ItemPncp[] = [];
    for (let pagina = 1; pagina <= 50; pagina++) {
      const url = `${baseIntegracao}/orgaos/${ref.cnpj}/compras/${ref.ano}/${ref.sequencial}/itens?pagina=${pagina}&tamanhoPagina=100`;
      const bruto = await getJson(url);
      const lista = Array.isArray(bruto) ? bruto : [];
      todos.push(...validarLista(lista, itemPncpSchema, url));
      if (lista.length < 100) break;
    }
    return todos;
  }

  /**
   * Resultados (vencedores e preço homologado) de um item.
   * GET /orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados
   */
  async function resultados(ref: RefContratacao, numeroItem: number): Promise<ResultadoPncp[]> {
    const url = `${baseIntegracao}/orgaos/${ref.cnpj}/compras/${ref.ano}/${ref.sequencial}/itens/${numeroItem}/resultados`;
    const bruto = await getJson(url);
    return validarLista(Array.isArray(bruto) ? bruto : [], resultadoPncpSchema, url);
  }

  return { contratacoesPublicadas, todasContratacoesPublicadas, itens, resultados };
}

export type ClientePncp = ReturnType<typeof criarClientePncp>;
