import { createHash } from 'node:crypto';
import { supabasePublico } from './supabase';

export interface OpcoesLimite {
  /** Nome da rota; entra na chave para cada rota ter sua cota. */
  rota: string;
  /** Requisições permitidas por janela. */
  limite: number;
  /** Tamanho da janela em segundos. */
  janelaSegundos: number;
}

type Handler = (req: Request) => Promise<Response> | Response;

/** Fallback em memória: dev sem Supabase, ou Supabase fora do ar. Vale por instância. */
const memoria = new Map<string, { janela: number; contagem: number }>();

/**
 * Limitador em memória, janela fixa. Exportado para teste.
 * @returns true se a requisição cabe no limite.
 */
export function consumirEmMemoria(
  chave: string,
  limite: number,
  janelaSegundos: number,
  agora = Date.now(),
): boolean {
  const janela = Math.floor(agora / 1000 / janelaSegundos);
  const atual = memoria.get(chave);
  if (!atual || atual.janela !== janela) {
    memoria.set(chave, { janela, contagem: 1 });
    if (memoria.size > 10_000) memoria.clear();
    return true;
  }
  atual.contagem += 1;
  return atual.contagem <= limite;
}

/**
 * IP do cliente, como a Vercel informa. Nunca é gravado: vira hash antes de sair daqui.
 * @param req Requisição recebida.
 */
export function ipDaRequisicao(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return xff?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'desconhecido';
}

/**
 * Chave de limite: SHA-256 de sal + rota + IP. O IP cru não vai para o banco (LGPD).
 */
export function chaveDeLimite(rota: string, ip: string): string {
  const sal = process.env.RATE_LIMIT_SALT ?? 'dev-sem-sal';
  return createHash('sha256').update(`${sal}:${rota}:${ip}`).digest('hex');
}

/**
 * Envolve um route handler com limite de taxa. TODA rota em src/app/api usa isto
 * (test/rotas-api.test.ts falha o CI se alguma não usar).
 * Contagem no Postgres (core.consumir_limite) para valer entre instâncias serverless.
 */
export function comLimiteDeTaxa(opcoes: OpcoesLimite, handler: Handler): Handler {
  return async (req) => {
    const chave = chaveDeLimite(opcoes.rota, ipDaRequisicao(req));
    let permitido: boolean;
    const sb = supabasePublico();
    if (sb) {
      const { data, error } = await sb.schema('core').rpc('consumir_limite', {
        p_chave: chave,
        p_limite: opcoes.limite,
        p_janela_segundos: opcoes.janelaSegundos,
      });
      permitido = error
        ? consumirEmMemoria(chave, opcoes.limite, opcoes.janelaSegundos)
        : data === true;
    } else {
      permitido = consumirEmMemoria(chave, opcoes.limite, opcoes.janelaSegundos);
    }
    if (!permitido) {
      return Response.json(
        { erro: 'Muitas requisições. Tente de novo em instantes.' },
        { status: 429, headers: { 'Retry-After': String(opcoes.janelaSegundos) } },
      );
    }
    return handler(req);
  };
}
