import { criarClientePncp, MODALIDADES_COLETADAS } from '@margem/core/pncp';
import { criarClienteSupabaseServidor } from '@margem/core/supabase/servidor';
import { z } from 'zod';
import { coletar, novoResumo } from './coletar';
import { repositorioSupabase } from './repositorio-supabase';
import type { Repositorio } from './tipos';

const listaCsv = (padrao: string) =>
  z
    .string()
    .default(padrao)
    .transform((s) =>
      s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    );

const env = z
  .object({
    SUPABASE_URL: z.url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
    COLETOR_UFS: listaCsv('PB').pipe(z.array(z.string().length(2)).min(1)),
    COLETOR_MODALIDADES: listaCsv(MODALIDADES_COLETADAS.join(','))
      .transform((xs) => xs.map(Number))
      .pipe(z.array(z.number().int().positive()).min(1)),
    COLETOR_DIAS: z.coerce.number().int().min(1).max(30).default(2),
    COLETOR_REVISITAR: z.coerce.number().int().min(0).max(500).default(40),
    /** "1" = não grava nada; imprime o que faria. Para rodar local sem Supabase. */
    COLETOR_SECO: z.enum(['0', '1']).default('0'),
  })
  // No Actions, um Secret não definido chega como string vazia: vazio conta como ausente.
  .parse(Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== '')));

/** Repositório que só conta (modo seco). */
function repositorioSeco(): Repositorio {
  return {
    async salvarContratacao(c, itens, resultados) {
      console.info(
        `[seco] ${c.numero_controle_pncp} ${c.municipio}/${c.uf} ${itens.length} itens, ${resultados.length} resultados — ${c.objeto.slice(0, 80)}`,
      );
    },
    async salvarResultadosRevisita() {},
    async pendentesDeResultado() {
      return [];
    },
    async marcarRevisitada() {},
    async iniciarLog() {
      return null;
    },
    async terminarLog() {},
  };
}

async function main() {
  const seco = env.COLETOR_SECO === '1';
  if (!seco && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error(
      'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios (ou COLETOR_SECO=1).',
    );
  }
  const repo = seco
    ? repositorioSeco()
    : repositorioSupabase(
        criarClienteSupabaseServidor(
          env.SUPABASE_URL as string,
          env.SUPABASE_SERVICE_ROLE_KEY as string,
        ),
      );

  const resumo = novoResumo();
  const pncp = criarClientePncp({
    aoRegistroInvalido: (r) => {
      resumo.registrosInvalidos++;
      if (resumo.registrosInvalidos <= 5) console.warn('registro inválido do PNCP:', r.erro);
    },
  });

  const logId = await repo.iniciarLog('coletor-pncp');
  try {
    await coletar(
      pncp,
      repo,
      {
        ufs: env.COLETOR_UFS,
        modalidades: env.COLETOR_MODALIDADES,
        dias: env.COLETOR_DIAS,
        revisitar: env.COLETOR_REVISITAR,
      },
      resumo,
    );
    const status =
      resumo.erros.length > 0 && resumo.contratacoesDeAlimentos === 0 && resumo.revisitadas === 0
        ? 'erro'
        : 'ok';
    await repo.terminarLog(logId, status, { ...resumo, erros: resumo.erros.slice(0, 50) });
    console.info(JSON.stringify({ ...resumo, erros: resumo.erros.length }, null, 2));
    for (const e of resumo.erros.slice(0, 10)) console.warn(e);
    if (status === 'erro') process.exitCode = 1;
  } catch (e) {
    await repo.terminarLog(logId, 'erro', {
      ...resumo,
      fatal: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
