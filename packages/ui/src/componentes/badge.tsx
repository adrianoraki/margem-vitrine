import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib';

/** Classes do badge por tom semântico (positivo, atencao, critico, info, neutro). */
export const variantesBadge = cva(
  'inline-flex h-6 items-center rounded-full px-2.5 text-caption font-semibold',
  {
    variants: {
      tom: {
        positivo: 'bg-accent-soft text-accent',
        atencao: 'bg-warning/15 text-warning',
        critico: 'bg-critical/12 text-critical',
        info: 'bg-info/12 text-info',
        neutro: 'bg-border text-text-secondary',
      },
    },
    defaultVariants: { tom: 'neutro' },
  },
);

export interface BadgeProps extends ComponentProps<'span'>, VariantProps<typeof variantesBadge> {}

/** Badge de status: 24 de altura, pill, texto 12/600, cores semânticas em versão soft. */
export function Badge({ className, tom, ...props }: BadgeProps) {
  return <span className={cn(variantesBadge({ tom }), className)} {...props} />;
}
