import { NextResponse } from 'next/server';
import { comLimiteDeTaxa } from '@/lib/limite-taxa';
import { destinoSeguro } from '@/lib/redirecionamento';
import { supabaseServidor } from '@/lib/supabase-servidor';

export const dynamic = 'force-dynamic';

/**
 * Volta do link mágico e do Google (fluxo PKCE): troca o `code` pela sessão e segue para o destino.
 * O destino só pode ser caminho interno (destinoSeguro).
 */
export const GET = comLimiteDeTaxa(
  { rota: 'auth-callback', limite: 20, janelaSegundos: 60 },
  async (req) => {
    const url = new URL(req.url);
    const codigo = url.searchParams.get('code');
    const destino = destinoSeguro(url.searchParams.get('next'));
    const sb = await supabaseServidor();

    if (codigo && sb) {
      const { error } = await sb.auth.exchangeCodeForSession(codigo);
      if (!error) return NextResponse.redirect(new URL(destino, url.origin));
    }
    // Link vencido, já usado, ou aberto em outro navegador (o PKCE guarda o verificador no cookie).
    return NextResponse.redirect(new URL('/entrar?erro=link', url.origin));
  },
);
