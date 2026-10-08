import 'server-only';
import type { Database } from '@margem/core';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { envPublico } from './env';

/**
 * Cliente do servidor Next com a sessão do usuário (cookies). Ainda é a chave pública:
 * o que o usuário vê continua decidido pela RLS, nunca pela service role.
 */
export async function supabaseServidor() {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: chave } = envPublico;
  if (!url || !chave) return null;
  const jar = await cookies();
  return createServerClient<Database>(url, chave, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) jar.set(name, value, options);
        } catch {
          // Server Component não pode gravar cookie; o middleware renova a sessão.
        }
      },
    },
  });
}
