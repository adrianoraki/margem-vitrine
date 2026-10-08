import { NextResponse } from 'next/server';
import { comLimiteDeTaxa } from '@/lib/limite-taxa';
import { supabaseServidor } from '@/lib/supabase-servidor';

export const dynamic = 'force-dynamic';

/** Encerra a sessão. Só POST (um GET de imagem ou prefetch não desloga ninguém). */
export const POST = comLimiteDeTaxa(
  { rota: 'auth-sair', limite: 20, janelaSegundos: 60 },
  async (req) => {
    const sb = await supabaseServidor();
    await sb?.auth.signOut();
    return NextResponse.redirect(new URL('/', req.url), { status: 303 });
  },
);
