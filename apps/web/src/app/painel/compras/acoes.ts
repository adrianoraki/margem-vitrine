'use server';

import { ErroNfe, lerNfe } from '@margem/core/dfe';
import { revalidatePath } from 'next/cache';
import { temCompras } from '@/lib/compras';
import { sessaoComEmpresa } from '@/lib/sessao';

export type ResultadoXml =
  | { ok: true; nova: boolean; itens: number; fornecedor: string; valor: number }
  | { ok: false; erro: string };

const TAMANHO_MAXIMO = 2_000_000;

/**
 * Importa um XML de NF-e (um arquivo por chamada, para caber no limite do server action).
 * O XML é lido e validado aqui; a gravação é do banco (compras.importar_nota), com a sessão do usuário.
 */
export async function importarXml(form: FormData): Promise<ResultadoXml> {
  const { sb, empresa, plano } = await sessaoComEmpresa();
  if (!temCompras(plano)) return { ok: false, erro: 'Seu plano não inclui o Margem Compras.' };

  const arquivo = form.get('arquivo');
  if (!(arquivo instanceof File) || arquivo.size === 0)
    return { ok: false, erro: 'Arquivo vazio.' };
  if (arquivo.size > TAMANHO_MAXIMO)
    return { ok: false, erro: 'Arquivo grande demais para uma NF-e.' };

  let nota;
  try {
    nota = lerNfe(await arquivo.text());
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof ErroNfe ? e.message : 'Não foi possível ler o arquivo.',
    };
  }

  const { data, error } = await sb
    .schema('compras')
    .rpc('importar_nota', { p_organizacao: empresa.id, p_nota: nota });
  if (error) return { ok: false, erro: 'Não foi possível gravar a nota agora. Tente de novo.' };

  revalidatePath('/painel', 'layout');
  const r = data as { nova: boolean; itens: number };
  return {
    ok: true,
    nova: r.nova,
    itens: r.itens,
    fornecedor: nota.emitente.nome,
    valor: nota.valorTotal,
  };
}

/** Revoga o certificado A1 (só o dono; a função no banco confere e apaga os segredos do Vault). */
export async function revogarCertificado(form: FormData): Promise<void> {
  const { sb } = await sessaoComEmpresa();
  const id = form.get('id');
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) return;
  await sb.schema('compras').rpc('revogar_certificado', { p_certificado: id });
  revalidatePath('/painel', 'layout');
}
