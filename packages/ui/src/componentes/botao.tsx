import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib';

/**
 * Classes do botão por variante. Especificação: doc, "Componentes compartilhados". 48 de altura no
 * mobile, 40 no desktop, raio 12, padding 0 20, texto 15/600. Foco: anel 3 px accent a 40%, 2 px de afastamento.
 */
export const variantesBotao = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-botao px-5',
    'h-12 md:h-10 text-[15px] font-semibold',
    'transition-[background-color,box-shadow,transform] duration-[120ms] ease-margem',
    'active:scale-[0.98] active:shadow-none',
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:pointer-events-none disabled:opacity-40',
  ],
  {
    variants: {
      variante: {
        primario: 'bg-primary text-bg hover:-translate-y-px hover:shadow-md hover:brightness-125',
        conversao:
          'bg-accent text-white hover:brightness-95 hover:shadow-[0_4px_12px_-2px_rgb(14_159_110/0.35)]',
        secundario:
          'border border-border bg-surface text-text-primary hover:bg-bg active:bg-border',
        texto: 'bg-transparent text-text-primary hover:bg-border/60',
      },
    },
    defaultVariants: { variante: 'primario' },
  },
);

export interface BotaoProps extends ComponentProps<'button'>, VariantProps<typeof variantesBotao> {
  /** Renderiza o filho (ex.: <a>, <Link>) com o visual do botão. */
  asChild?: boolean;
}

/**
 * Botão do design system. Use `conversao` (verde) só para ação que gera dinheiro para o cliente.
 */
export function Botao({ className, variante, asChild = false, ...props }: BotaoProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(variantesBotao({ variante }), className)} {...props} />;
}
