import { ehChaveDeServico } from '@margem/core/supabase';
import { z } from 'zod';

// Variáveis públicas (chegam ao navegador). Opcionais no dev: sem Supabase, a landing
// abre sem o contador ao vivo. Em produção, faltar alguma é erro de configuração.
const esquema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20)
    .refine(
      (k) => !ehChaveDeServico(k),
      'NEXT_PUBLIC_SUPABASE_ANON_KEY é uma chave de serviço. Nunca exponha a service role.',
    )
    .optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

export const envPublico = esquema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
});

/** Supabase configurado? Sem ele, recursos ao vivo ficam ocultos em vez de quebrar. */
export const temSupabase = Boolean(
  envPublico.NEXT_PUBLIC_SUPABASE_URL && envPublico.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
