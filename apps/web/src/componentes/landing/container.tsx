import { cn } from '@margem/ui';
import type { ComponentProps } from 'react';

/** Grid do doc: máximo 1280, margem lateral 16 (mobile) / 24 (tablet) / 32 (web). */
export function Container({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('max-w-conteudo mx-auto w-full px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  );
}
