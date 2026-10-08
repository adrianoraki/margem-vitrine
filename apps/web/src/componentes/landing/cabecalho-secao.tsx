import { cn } from '@margem/ui';
import type { ReactNode } from 'react';

/** Rótulo + título + apoio, o padrão de abertura de cada seção. */
export function CabecalhoSecao({
  id,
  rotulo,
  titulo,
  apoio,
  centro = false,
}: {
  id: string;
  rotulo: string;
  titulo: ReactNode;
  apoio?: ReactNode;
  centro?: boolean;
}) {
  return (
    <div className={cn('max-w-2xl', centro && 'mx-auto text-center')}>
      <p className="text-small text-text-secondary font-semibold">{rotulo}</p>
      <h2
        id={id}
        className="mt-2 text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-balance md:text-[2.25rem]"
      >
        {titulo}
      </h2>
      {apoio && <p className="text-body text-text-secondary mt-3 md:text-[17px]">{apoio}</p>}
    </div>
  );
}
