import { criarClienteSupabasePublico, type ClienteMargem } from '@margem/core/supabase';
import { envPublico } from './env';

let cliente: ClienteMargem | null | undefined;

/**
 * Cliente Supabase com a chave pública (RLS aplicada). Nulo quando o ambiente não tem Supabase.
 * Serve ao servidor Next e ao navegador; a service role nunca passa por aqui.
 */
export function supabasePublico(): ClienteMargem | null {
  if (cliente !== undefined) return cliente;
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: chave } = envPublico;
  // Leituras públicas da landing e do contador: se o banco não responder, a página esconde o bloco.
  // Sem novas tentativas (o padrão do supabase-js espera 1 + 2 + 4 s) e com teto de 4 s.
  cliente =
    url && chave
      ? criarClienteSupabasePublico(url, chave, { db: { retry: false, timeout: 4000 } })
      : null;
  return cliente;
}
