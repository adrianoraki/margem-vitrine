'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { chaveVinculo } from '@/lib/margem-item';
import { sessaoComEmpresa } from '@/lib/sessao';

const vinculoSchema = z.object({
  licitacao: z.string().min(10).max(80),
  descricao: z.string().min(1).max(2000),
  produto: z.union([z.uuid(), z.literal('')]),
  fator: z.coerce.number().positive().max(100_000),
  unidade: z.string().max(40).optional(),
});

/**
 * Liga um item de licitação a um produto comprado (com fator de conversão de unidade),
 * ou desfaz a ligação quando o produto vem vazio.
 */
export async function salvarVinculo(form: FormData): Promise<void> {
  const { sb, empresa, user } = await sessaoComEmpresa();
  const r = vinculoSchema.safeParse(Object.fromEntries(form));
  if (!r.success) return;
  const { licitacao, descricao, produto, fator, unidade } = r.data;
  const vinculos = sb.schema('compras').from('vinculos_licitacao');
  const chave = chaveVinculo(descricao);

  if (!produto) {
    await vinculos.delete().eq('organizacao_id', empresa.id).eq('descricao_normalizada', chave);
  } else {
    // O produto tem que ser da própria empresa (a RLS de produtos só mostra os dela).
    const { data: dono } = await sb
      .schema('compras')
      .from('produtos')
      .select('id')
      .eq('id', produto)
      .eq('organizacao_id', empresa.id)
      .maybeSingle();
    if (!dono) return;
    await vinculos.upsert(
      {
        organizacao_id: empresa.id,
        produto_id: produto,
        descricao_normalizada: chave,
        unidade_licitacao: unidade || null,
        fator_conversao: fator,
        confirmado_por: user.id,
      },
      { onConflict: 'organizacao_id,descricao_normalizada' },
    );
  }
  revalidatePath(`/painel/licitacoes/${encodeURIComponent(licitacao)}`);
}
