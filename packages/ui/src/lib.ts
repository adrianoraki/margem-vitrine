import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// O tailwind-merge precisa conhecer a escala tipográfica do tema: sem isso ele lê
// `text-caption` como COR e o descarta ao juntar com `text-accent` (badge com letra gigante).
const twMerge = extendTailwindMerge({
  extend: {
    theme: { text: ['display', 'h1', 'h2', 'h3', 'body', 'small', 'caption', 'kpi'] },
  },
});

/**
 * Junta classes Tailwind resolvendo conflitos (padrão shadcn/ui), ciente dos tokens do Margem.
 * @param entradas Classes, condicionais e arrays.
 */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas));
}
