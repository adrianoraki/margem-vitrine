'use client';

import type { Database } from '@margem/core';
import { createBrowserClient } from '@supabase/ssr';
import { envPublico } from './env';

/**
 * Cliente do navegador com sessão em cookie (login). Só a chave pública:
 * env.ts derruba a aplicação se ela for de serviço.
 */
export function supabaseNavegador() {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: chave } = envPublico;
  if (!url || !chave) throw new Error('Supabase não configurado neste ambiente.');
  return createBrowserClient<Database>(url, chave);
}
