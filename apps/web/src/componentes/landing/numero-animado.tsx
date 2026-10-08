'use client';

import { formatarInteiro } from '@margem/core';
import { useEffect, useRef, useState } from 'react';

/**
 * Número de KPI que conta até o valor em 600 ms quando entra na tela (doc, "Micro-interações").
 * O HTML do servidor já traz o valor final: sem JS, ou com movimento reduzido, nada anima.
 */
export function NumeroAnimado({ valor, className }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [mostrado, setMostrado] = useState(valor);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let quadro = 0;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        observador.disconnect();
        const inicio = performance.now();
        const passo = (t: number) => {
          const p = Math.min(1, (t - inicio) / 600);
          setMostrado(Math.round(valor * (1 - (1 - p) ** 3)));
          if (p < 1) quadro = requestAnimationFrame(passo);
        };
        setMostrado(0);
        quadro = requestAnimationFrame(passo);
      },
      { threshold: 0.6 },
    );
    observador.observe(el);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, [valor]);

  return (
    <span ref={ref} className={className}>
      {formatarInteiro(mostrado)}
    </span>
  );
}
