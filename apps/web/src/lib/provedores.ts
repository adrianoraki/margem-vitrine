import 'server-only';
import { envPublico } from './env';

/**
 * Diz se o login com Google está ativo no Supabase (endpoint público /auth/v1/settings).
 * Sem isso, o botão levaria a uma página de erro crua do Supabase.
 */
export async function googleAtivo(): Promise<boolean> {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: chave } = envPublico;
  if (!url || !chave) return false;
  try {
    const r = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: chave },
      next: { revalidate: 300 },
    });
    if (!r.ok) return false;
    const j = (await r.json()) as { external?: { google?: boolean } };
    return j.external?.google === true;
  } catch {
    return false;
  }
}
