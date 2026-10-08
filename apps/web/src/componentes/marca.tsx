import { cn } from '@margem/ui';

/** Símbolo do Margem (mesmo desenho do favicon, src/app/icon.svg). Inverte no tema escuro pelos tokens. */
export function Simbolo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn('size-7 shrink-0', className)}>
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <path
        d="M15 45V21l12 14 10-10 11 11"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-bg"
      />
      <circle cx="49" cy="21" r="6" className="fill-accent" />
    </svg>
  );
}

/** Símbolo + nome. */
export function Marca({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-titulo inline-flex items-center gap-2 text-[19px] font-bold tracking-tight',
        className,
      )}
    >
      <Simbolo />
      Margem
    </span>
  );
}
