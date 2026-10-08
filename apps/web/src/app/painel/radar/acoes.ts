'use server';

import { UFS_NORDESTE } from '@margem/core/pncp';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { sessaoComEmpresa } from '@/lib/sessao';

const radarSchema = z.object({
  termos: z.array(z.string().min(2).max(60)).min(1, 'Escolha ao menos um item.').max(60),
  ufs: z.array(z.enum(UFS_NORDESTE)).max(UFS_NORDESTE.length),
});

export type EstadoRadar = { erro?: string };

/** Passo 2 do onboarding: grava o radar da empresa (cria na primeira vez, atualiza depois). */
export async function salvarRadar(_: EstadoRadar, form: FormData): Promise<EstadoRadar> {
  const { sb, empresa, regra } = await sessaoComEmpresa();
  const r = radarSchema.safeParse({
    termos: form.getAll('termos').map(String),
    ufs: form.getAll('ufs').map(String),
  });
  if (!r.success) return { erro: r.error.issues[0]?.message ?? 'Confira as escolhas.' };

  // Só termos que existem no catálogo: o radar casa contra termos_casados, que vêm dele.
  const { data: catalogo } = await sb.schema('licita').from('catalogo_termos').select('termo');
  const validos = new Set((catalogo ?? []).map((c) => c.termo));
  const termos = r.data.termos.filter((t) => validos.has(t));
  if (!termos.length) return { erro: 'Escolha ao menos um item.' };

  const { error } = regra
    ? await sb
        .schema('licita')
        .from('regras_radar')
        .update({ termos, ufs: r.data.ufs })
        .eq('id', regra.id)
    : await sb
        .schema('licita')
        .from('regras_radar')
        .insert({ organizacao_id: empresa.id, termos, ufs: r.data.ufs });
  if (error) return { erro: 'Não foi possível salvar o radar agora. Tente de novo.' };

  revalidatePath('/painel', 'layout');
  redirect('/painel/radar');
}
