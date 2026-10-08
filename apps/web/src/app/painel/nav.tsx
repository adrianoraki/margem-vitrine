'use client';

import { cn } from '@margem/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITENS = [
  { href: '/painel', rotulo: 'Início' },
  { href: '/painel/radar', rotulo: 'Radar' },
  { href: '/painel/funil', rotulo: 'Funil' },
  { href: '/painel/compras', rotulo: 'Compras' },
  { href: '/painel/empresa', rotulo: 'Empresa' },
];

/** Navegação da área logada. A aba ativa é a de prefixo mais longo que casa com a rota. */
export function NavPainel({ className }: { className?: string }) {
  const rota = usePathname();
  const ativo = ITENS.filter((i) => rota === i.href || rota.startsWith(`${i.href}/`)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0]?.href;
  return (
    <nav aria-label="Área logada" className={cn('gap-1', className)}>
      {ITENS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={ativo === i.href ? 'page' : undefined}
          className={cn(
            'text-small rounded-botao shrink-0 px-3 py-2 font-medium transition-colors',
            'focus-visible:ring-accent/40 focus-visible:ring-[3px] focus-visible:outline-none',
            ativo === i.href
              ? 'bg-accent-soft text-text-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-border/60',
          )}
        >
          {i.rotulo}
        </Link>
      ))}
    </nav>
  );
}
