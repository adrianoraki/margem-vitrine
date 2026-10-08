import type { ComponentProps } from 'react';
import { cn } from '../lib';

export interface CardProps extends ComponentProps<'div'> {
  /** Card clicável ganha hover (sombra md) e active (escala 0,99). */
  clicavel?: boolean;
}

/**
 * Card: surface, borda 1 px, raio 16, padding 20 (16 no mobile), sombra sm.
 */
export function Card({ className, clicavel = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border-border bg-surface border p-4 shadow-sm md:p-5',
        clicavel &&
          'ease-margem hover:border-text-secondary/20 cursor-pointer transition-[box-shadow,transform,border-color] duration-[120ms] hover:shadow-md active:scale-[0.99]',
        className,
      )}
      {...props}
    />
  );
}
