'use server';

import { cnpjSchema } from '@margem/core';
import { UFS_NORDESTE } from '@margem/core/pncp';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { consultarCnpj, type DadosCnpj } from '@/lib/brasilapi';
import { chaveDeLimite } from '@/lib/limite-taxa';
import { carregarSessao } from '@/lib/sessao';

/** Busca os dados públicos do CNPJ para preencher o formulário. Exige sessão; 10 por minuto. */
export async function buscarCnpj(
  cnpj: string,
): Promise<{ ok: true; dados: DadosCnpj | null } | { ok: false; erro: string }> {
  const { sb, user } = await carregarSessao();
  const r = cnpjSchema.safeParse(cnpj);
  if (!r.success) return { ok: false, erro: 'CNPJ inválido. Confira os 14 dígitos.' };
  const { data: cabe } = await sb.schema('core').rpc('consumir_limite', {
    p_chave: chaveDeLimite('acao-buscar-cnpj', user.id),
    p_limite: 10,
    p_janela_segundos: 60,
  });
  if (cabe === false) return { ok: false, erro: 'Muitas buscas seguidas. Espere um minuto.' };
  return { ok: true, dados: await consultarCnpj(r.data) };
}

const empresaSchema = z.object({
  cnpj: cnpjSchema,
  razaoSocial: z.string().trim().min(2, 'Digite a razão social.').max(200),
  nomeFantasia: z.string().trim().max(200).optional(),
  cnae: z
    .string()
    .trim()
    .regex(/^\d{0,7}$/, 'CNAE tem até 7 dígitos.')
    .optional(),
  uf: z.string().trim().toUpperCase().length(2, 'Escolha a UF.'),
  municipio: z.string().trim().max(120).optional(),
});

export type EstadoEmpresa = {
  ok?: boolean;
  erro?: string;
  campos?: Partial<Record<string, string>>;
};

/** Passo 1 do onboarding: cria a empresa (ou atualiza, se já existe). */
export async function salvarEmpresa(_: EstadoEmpresa, form: FormData): Promise<EstadoEmpresa> {
  const { sb, empresa } = await carregarSessao();
  const r = empresaSchema.safeParse(Object.fromEntries(form));
  if (!r.success) {
    const campos: Record<string, string> = {};
    for (const i of r.error.issues) campos[String(i.path[0])] ??= i.message;
    return { erro: 'Confira os campos destacados.', campos };
  }
  const d = r.data;
  const vazio = (v?: string) => (v ? v : null);

  if (empresa) {
    const { error } = await sb
      .schema('core')
      .from('organizacoes')
      .update({
        razao_social: d.razaoSocial,
        nome_fantasia: vazio(d.nomeFantasia),
        cnae_principal: vazio(d.cnae),
        uf: d.uf,
        municipio: vazio(d.municipio),
      })
      .eq('id', empresa.id);
    if (error) return { erro: 'Não foi possível salvar agora. Tente de novo em instantes.' };
    revalidatePath('/painel', 'layout');
    return { ok: true };
  }

  const { error } = await sb.schema('core').rpc('criar_organizacao', {
    p_cnpj: d.cnpj,
    p_razao_social: d.razaoSocial,
    p_nome_fantasia: vazio(d.nomeFantasia) ?? undefined,
    p_cnae_principal: vazio(d.cnae) ?? undefined,
    p_uf: d.uf,
    p_municipio: vazio(d.municipio) ?? undefined,
  });
  if (error) {
    if (error.code === '23505') {
      return { erro: 'Este CNPJ já tem conta no Margem. Peça ao dono para te convidar.' };
    }
    return { erro: 'Não foi possível cadastrar agora. Tente de novo em instantes.' };
  }
  revalidatePath('/painel', 'layout');
  // Radar já começa com a UF da empresa, se ela for do Nordeste.
  redirect(
    `/painel/radar/configurar${(UFS_NORDESTE as readonly string[]).includes(d.uf) ? `?uf=${d.uf}` : ''}`,
  );
}
