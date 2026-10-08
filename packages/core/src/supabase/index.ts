import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { ehChaveDeServico } from './chaves';

export { ehChaveDeServico } from './chaves';
export type { Database } from '../database.types';

/** Cliente tipado com os três esquemas do Margem. */
export type ClienteMargem = SupabaseClient<Database>;

/**
 * Cria o cliente para site e app, com a chave pública (anon/publishable). A RLS decide o acesso.
 * Recusa chave de serviço: se ela chegar aqui, é bug de configuração e a execução para.
 * @param url URL do projeto Supabase.
 * @param chavePublica Chave anon/publishable.
 * @param opcoes Opções do supabase-js (ex.: `{ db: { retry: false, timeout: 4000 } }`).
 */
export function criarClienteSupabasePublico(
  url: string,
  chavePublica: string,
  opcoes?: OpcoesClientePublico,
): ClienteMargem {
  if (ehChaveDeServico(chavePublica)) {
    throw new Error(
      'Chave de serviço do Supabase no cliente público. Use a chave anon/publishable.',
    );
  }
  return createClient<Database>(url, chavePublica, opcoes);
}

/** Opções repassadas ao createClient do supabase-js. */
export type OpcoesClientePublico = Parameters<typeof createClient<Database>>[2];
