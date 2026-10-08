import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import type { ClienteMargem } from './index';

/**
 * Cliente com a service role, que IGNORA a RLS. Só para jobs no servidor (coletor PNCP,
 * importador DF-e, keep-alive). apps/web é proibido de importar este módulo pelo ESLint.
 * @param url URL do projeto Supabase.
 * @param chaveServico SUPABASE_SERVICE_ROLE_KEY, vinda de Secret do GitHub Actions.
 */
export function criarClienteSupabaseServidor(url: string, chaveServico: string): ClienteMargem {
  if ('window' in globalThis) {
    throw new Error('Cliente de serviço do Supabase não pode rodar no navegador.');
  }
  return createClient<Database>(url, chaveServico, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
