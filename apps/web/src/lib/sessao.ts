import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { supabaseServidor } from './supabase-servidor';

export interface Empresa {
  id: string;
  cnpj: string | null;
  razao_social: string;
  nome_fantasia: string | null;
  uf: string | null;
  municipio: string | null;
}

export interface Regra {
  id: string;
  termos: string[];
  ufs: string[];
}

/**
 * Sessão da área logada: usuário, empresa (primeira organização de que é membro), plano e radar.
 * Sem usuário, manda para /entrar. `cache` evita repetir as leituras entre layout e página.
 */
export const carregarSessao = cache(async () => {
  const sb = await supabaseServidor();
  if (!sb) redirect('/entrar');
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: vinculo } = await sb
    .schema('core')
    .from('membros')
    .select('papel, organizacoes(id, cnpj, razao_social, nome_fantasia, uf, municipio)')
    .eq('user_id', user.id)
    .order('criado_em')
    .limit(1)
    .maybeSingle();
  const empresa = (vinculo?.organizacoes as Empresa | null | undefined) ?? null;

  const [assinatura, regra] = empresa
    ? await Promise.all([
        sb
          .schema('core')
          .from('assinaturas')
          .select('plano')
          .eq('organizacao_id', empresa.id)
          .maybeSingle(),
        sb
          .schema('licita')
          .from('regras_radar')
          .select('id, termos, ufs')
          .eq('organizacao_id', empresa.id)
          .eq('ativo', true)
          .order('criado_em')
          .limit(1)
          .maybeSingle(),
      ])
    : [null, null];

  return {
    sb,
    user,
    empresa,
    papel: vinculo?.papel ?? null,
    plano: assinatura?.data?.plano ?? null,
    regra: (regra?.data as Regra | null | undefined) ?? null,
  };
});

/** Sessão que exige empresa cadastrada; sem ela, volta ao passo 1. */
export async function sessaoComEmpresa() {
  const s = await carregarSessao();
  if (!s.empresa) redirect('/painel/empresa');
  return { ...s, empresa: s.empresa };
}
