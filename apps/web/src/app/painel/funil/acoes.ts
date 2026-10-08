'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sessaoComEmpresa } from '@/lib/sessao';

const ESTAGIOS = ['interesse', 'proposta_enviada', 'ganhou', 'perdeu'] as const;

const entradaSchema = z.object({
  id: z.string().min(10).max(80),
  estagio: z.enum([...ESTAGIOS, 'remover']),
});

/** Põe a licitação no funil, muda o estágio, ou tira do funil ("remover"). */
export async function atualizarFunil(form: FormData): Promise<void> {
  const { sb, empresa, user } = await sessaoComEmpresa();
  const r = entradaSchema.safeParse({ id: form.get('id'), estagio: form.get('estagio') });
  if (!r.success) return;
  const { id, estagio } = r.data;
  const funil = sb.schema('licita').from('funil');

  if (estagio === 'remover') {
    await funil.delete().eq('organizacao_id', empresa.id).eq('numero_controle_pncp', id);
  } else {
    await funil.upsert(
      {
        organizacao_id: empresa.id,
        numero_controle_pncp: id,
        estagio,
        criado_por: user.id,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'organizacao_id,numero_controle_pncp' },
    );
  }
  revalidatePath('/painel', 'layout');
}
