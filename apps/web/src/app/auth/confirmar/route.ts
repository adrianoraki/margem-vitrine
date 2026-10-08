import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { comLimiteDeTaxa } from '@/lib/limite-taxa';
import { destinoSeguro } from '@/lib/redirecionamento';
import { supabaseServidor } from '@/lib/supabase-servidor';

export const dynamic = 'force-dynamic';

const TIPOS: readonly EmailOtpType[] = [
  'email',
  'magiclink',
  'signup',
  'invite',
  'recovery',
  'email_change',
];

/**
 * Link do e-mail no formato token_hash (template do Supabase aponta para cá).
 * Diferente do fluxo PKCE, não depende de cookie do navegador que pediu o link:
 * funciona abrindo o e-mail no celular e em qualquer navegador.
 */
export const GET = comLimiteDeTaxa(
  { rota: 'auth-confirmar', limite: 20, janelaSegundos: 60 },
  async (req) => {
    const url = new URL(req.url);
    const tokenHash = url.searchParams.get('token_hash');
    const tipo = url.searchParams.get('type') as EmailOtpType | null;
    const destino = destinoSeguro(url.searchParams.get('next'));
    const sb = await supabaseServidor();

    if (tokenHash && tipo && TIPOS.includes(tipo) && sb) {
      const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
      if (!error) return NextResponse.redirect(new URL(destino, url.origin));
    }
    return NextResponse.redirect(new URL('/entrar?erro=link', url.origin));
  },
);
