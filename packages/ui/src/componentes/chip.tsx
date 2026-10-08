import type { ComponentProps } from 'react';
import { cn } from '../lib';

export interface ChipProps extends Omit<ComponentProps<'button'>, 'onChange'> {
  selecionado: boolean;
  onChange?: (selecionado: boolean) => void;
}

/**
 * Chip de filtro (32 de altura, pill). Selecionado: fundo accent-soft, borda accent e check.
 * É um toggle acessível: aria-pressed reflete o estado.
 */
export function Chip({ selecionado, onChange, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      onClick={() => onChange?.(!selecionado)}
      className={cn(
        'text-small inline-flex h-8 items-center gap-1.5 rounded-full border px-3 transition-colors duration-[120ms]',
        'focus-visible:ring-accent/40 focus-visible:ring-[3px] focus-visible:outline-none',
        'disabled:opacity-40',
        selecionado
          ? 'border-accent bg-accent-soft text-text-primary'
          : 'border-border hover:bg-bg',
        className,
      )}
      {...props}
    >
      {selecionado && (
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-3.5 animate-[chip-check_120ms_ease-out]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 8.5l3 3 7-7" />
        </svg>
      )}
      {children}
    </button>
  );
}
