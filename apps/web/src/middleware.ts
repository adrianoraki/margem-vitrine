import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Renova a sessão (cookies) e protege a área logada. Só roda nas rotas do matcher,
// então a landing continua estática e sem custo de middleware.
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let resposta = NextResponse.next({ request: req });
  if (!url || !chave) return resposta;

  const sb = createServerClient(url, chave, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) req.cookies.set(name, value);
        resposta = NextResponse.next({ request: req });
        for (const { name, value, options } of lista) resposta.cookies.set(name, value, options);
      },
    },
  });

  // Sem cookie de sessão não há o que validar: poupa uma ida ao Supabase por visitante anônimo.
  const temSessao = req.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));
  // getUser valida o JWT no Supabase (getSession só leria o cookie, sem validar).
  const user = temSessao ? (await sb.auth.getUser()).data.user : null;

  const { pathname } = req.nextUrl;
  if (!user && pathname.startsWith('/painel')) {
    const entrar = req.nextUrl.clone();
    entrar.pathname = '/entrar';
    entrar.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(entrar);
  }
  if (user && pathname === '/entrar') {
    const painel = req.nextUrl.clone();
    painel.pathname = '/painel';
    painel.search = '';
    return NextResponse.redirect(painel);
  }
  return resposta;
}

export const config = { matcher: ['/painel/:path*', '/entrar'] };
