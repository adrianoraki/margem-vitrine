'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * TanStack Query para cache e sincronização. Um QueryClient por aba (useState evita
 * recriar a cada render e evita compartilhar cache entre requisições no servidor).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}
