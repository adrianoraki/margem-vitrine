import { Botao } from '@margem/ui';
import Link from 'next/link';
import { Marca } from '../marca';

const links = [
  { href: '/#produtos', rotulo: 'Produtos' },
  { href: '/#como-funciona', rotulo: 'Como funciona' },
  { href: '/#precos', rotulo: 'Preços' },
  { href: '/#contadores', rotulo: 'Para contadores' },
];

/** Navbar flutuante com vidro (camada que flutua sobre o conteúdo, nunca sobre números). */
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="max-w-conteudo border-border/70 bg-surface/75 mx-auto flex h-14 items-center justify-between gap-4 rounded-full border pr-2 pl-5 shadow-sm backdrop-blur-[16px]">
        <Link
          href="/"
          aria-label="Margem, início"
          className="focus-visible:ring-accent/40 rounded-full focus-visible:ring-[3px] focus-visible:outline-none"
        >
          <Marca />
        </Link>
        <nav
          aria-label="Principal"
          className="text-small text-text-secondary hidden items-center gap-1 md:flex"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hover:bg-bg hover:text-text-primary rounded-full px-3 py-1.5 transition-colors duration-[120ms]"
            >
              {l.rotulo}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Botao asChild variante="texto" className="hidden rounded-full md:inline-flex">
            <Link href="/entrar">Entrar</Link>
          </Botao>
          <Botao asChild className="h-10 rounded-full px-4 md:h-10">
            <Link href="/entrar">Começar grátis</Link>
          </Botao>
          <details className="group relative md:hidden">
            <summary
              className="hover:bg-bg flex size-10 cursor-pointer list-none items-center justify-center rounded-full"
              aria-label="Abrir menu"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 8h16M4 16h16" className="group-open:hidden" />
                <path d="M6 6l12 12M18 6 6 18" className="hidden group-open:block" />
              </svg>
            </summary>
            <nav
              aria-label="Menu"
              className="animate-entrar rounded-sheet border-border bg-surface-raised/95 absolute top-12 right-0 w-60 border p-2 shadow-lg backdrop-blur-[16px]"
            >
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-botao text-body hover:bg-bg block px-4 py-3"
                >
                  {l.rotulo}
                </a>
              ))}
              <Link href="/entrar" className="rounded-botao text-body hover:bg-bg block px-4 py-3">
                Entrar
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
