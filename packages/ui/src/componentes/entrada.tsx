import type { ComponentProps } from 'react';
import { cn } from '../lib';

export interface EntradaProps extends ComponentProps<'input'> {
  /** Marca o campo como inválido (borda critical + aria-invalid). */
  invalido?: boolean;
}

/**
 * Campo de texto: raio 8 (inputs), 48 de altura no mobile e 40 no desktop, foco com anel accent.
 * Use sempre com um <label> ligado por `id`/`htmlFor`.
 */
export function Entrada({ className, invalido = false, ...props }: EntradaProps) {
  return (
    <input
      aria-invalid={invalido || undefined}
      className={cn(
        'rounded-input border-border bg-surface text-body text-text-primary h-12 w-full border px-3.5 md:h-11',
        'placeholder:text-text-secondary/70 ease-margem transition-[border-color,box-shadow] duration-[120ms]',
        'focus-visible:border-accent focus-visible:ring-accent/25 focus-visible:ring-[3px] focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalido && 'border-critical focus-visible:border-critical focus-visible:ring-critical/20',
        className,
      )}
      {...props}
    />
  );
}
