import 'server-only';
import { z } from 'zod';
import { capitalizarNome } from './texto';

const respostaSchema = z.object({
  razao_social: z.string().min(1),
  nome_fantasia: z.string().nullish(),
  cnae_fiscal: z.union([z.number(), z.string()]).nullish(),
  uf: z.string().length(2).nullish(),
  municipio: z.string().nullish(),
});

export interface DadosCnpj {
  razaoSocial: string;
  nomeFantasia: string | null;
  cnae: string | null;
  uf: string | null;
  municipio: string | null;
}

/**
 * Consulta pública do CNPJ na BrasilAPI (dados da Receita). Nulo quando não acha
 * (CNPJ fictício, por exemplo) ou quando a API não responde em 5 s: o formulário segue manual.
 * @param cnpj Só dígitos, já validado.
 */
export async function consultarCnpj(cnpj: string): Promise<DadosCnpj | null> {
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86_400 },
    });
    if (!r.ok) return null;
    const d = respostaSchema.safeParse(await r.json());
    if (!d.success) return null;
    return mapearCnpj(d.data);
  } catch {
    return null;
  }
}

/** Converte a resposta da BrasilAPI para o formato do formulário. Exportado para teste. */
export function mapearCnpj(d: z.infer<typeof respostaSchema>): DadosCnpj {
  return {
    razaoSocial: d.razao_social.trim(),
    nomeFantasia: d.nome_fantasia?.trim() ? capitalizarNome(d.nome_fantasia.trim()) : null,
    cnae: d.cnae_fiscal ? String(d.cnae_fiscal) : null,
    uf: d.uf?.toUpperCase() ?? null,
    municipio: d.municipio ? capitalizarNome(d.municipio) : null,
  };
}
