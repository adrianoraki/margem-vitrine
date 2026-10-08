import { Badge, Botao } from '@margem/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Marca } from '@/componentes/marca';
import { carregarSessao } from '@/lib/sessao';
import { NavPainel } from './nav';

export const metadata: Metadata = { title: 'Painel — Margem', robots: { index: false } };
export const dynamic = 'force-dynamic';

const NOME_PLANO: Record<string, string> = {
  free: 'Grátis',
  licita_pro: 'Licita Pro',
  compras_pro: 'Compras Pro',
  completo: 'Completo',
};

export default async function LayoutPainel({ children }: { children: ReactNode }) {
  const { user, empresa, plano } = await carregarSessao();

  return (
    <div className="min-h-dvh">
      <header className="border-border bg-surface/80 sticky top-0 z-20 border-b backdrop-blur-[16px]">
        <div className="max-w-conteudo mx-auto flex h-16 items-center gap-6 px-4 sm:px-8">
          <Link href="/painel" className="shrink-0">
            <Marca />
          </Link>
          <NavPainel className="hidden md:flex" />
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="text-small truncate font-medium">
                {empresa?.nome_fantasia ?? empresa?.razao_social ?? 'Empresa não cadastrada'}
              </p>
              <p className="text-caption text-text-secondary truncate">{user.email}</p>
            </div>
            {plano && (
              <Badge tom={plano === 'free' ? 'neutro' : 'positivo'}>{NOME_PLANO[plano]}</Badge>
            )}
            <form action="/auth/sair" method="post">
              <Botao type="submit" variante="texto" className="px-3">
                Sair
              </Botao>
            </form>
          </div>
        </div>
        <NavPainel className="flex overflow-x-auto px-4 pb-2 md:hidden" />
      </header>
      <main className="max-w-conteudo mx-auto px-4 py-8 sm:px-8 md:py-10">{children}</main>
    </div>
  );
}
