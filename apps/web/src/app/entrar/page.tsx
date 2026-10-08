import { formatarInteiro } from '@margem/core';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PreviaProduto } from '@/componentes/landing/hero';
import { Marca } from '@/componentes/marca';
import { temSupabase } from '@/lib/env';
import { googleAtivo } from '@/lib/provedores';
import { destinoSeguro } from '@/lib/redirecionamento';
import { carregarVitrine } from '@/lib/vitrine';
import { FormularioEntrar } from './formulario';

export const metadata: Metadata = { title: 'Entrar — Margem', robots: { index: false } };

const ERROS: Record<string, string> = {
  link: 'Esse link expirou ou já foi usado. Peça um novo abaixo, ou use o código do último e-mail.',
};

const GARANTIAS = [
  'Sem senha para lembrar',
  'Plano grátis para sempre',
  'Dados no Brasil, conforme a LGPD',
];

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [google, vitrine] = await Promise.all([googleAtivo(), carregarVitrine()]);
  const destino = destinoSeguro(params.next);

  return (
    <main className="grid min-h-dvh lg:grid-cols-12">
      {/* Formulário */}
      <section className="relative isolate flex flex-col px-4 py-5 sm:px-8 lg:col-span-5 lg:px-12 xl:px-16">
        <div
          aria-hidden
          className="fundo-grade text-text-secondary absolute inset-0 -z-10 opacity-60"
        />
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-botao focus-visible:ring-accent/40 focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <Marca />
          </Link>
          <Link href="/" className="text-small text-text-secondary hover:text-text-primary">
            ← Voltar ao site
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
          <div className="animate-entrar rounded-sheet border-border bg-surface border p-6 shadow-lg sm:p-8">
            <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em] sm:text-[2rem]">
              Entre no Margem
            </h1>
            <p className="text-body text-text-secondary mt-2 mb-7">
              Enviamos um link de acesso para o seu e-mail. Se ainda não tem conta, ela é criada
              agora.
            </p>
            {temSupabase ? (
              <FormularioEntrar
                destino={destino}
                google={google}
                erroInicial={params.erro ? ERROS[params.erro] : undefined}
              />
            ) : (
              <p className="rounded-card border-border bg-bg text-small text-text-secondary border p-4">
                Login indisponível neste ambiente (Supabase não configurado).
              </p>
            )}
          </div>

          <ul className="text-small text-text-secondary mt-6 grid gap-2">
            {GARANTIAS.map((g) => (
              <li key={g} className="flex items-center gap-2">
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="text-accent size-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
                {g}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-caption text-text-secondary">
          Ao continuar, você concorda com o tratamento dos seus dados descrito em{' '}
          <Link
            href="/privacidade"
            className="hover:text-text-primary underline underline-offset-2"
          >
            Privacidade e LGPD
          </Link>
          .
        </p>
      </section>

      {/* Vitrine: o produto de verdade, sobre o fundo escuro */}
      <aside className="relative isolate hidden overflow-hidden bg-[#0B1220] text-[#F2F4F7] lg:col-span-7 lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-20">
        <div aria-hidden className="fundo-grade absolute inset-0 -z-10 text-white opacity-25" />
        <div
          aria-hidden
          className="absolute -top-40 -right-40 -z-10 size-[640px] rounded-full bg-[radial-gradient(closest-side,rgb(52_211_153/0.22),transparent)]"
        />
        <div
          aria-hidden
          className="absolute -bottom-56 -left-40 -z-10 size-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(96_165_250/0.14),transparent)]"
        />

        <div className="mx-auto w-full max-w-[640px] py-16">
          <p className="text-small font-semibold text-[#34D399]">Margem Licita</p>
          <p className="font-titulo mt-2 text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-balance xl:text-[2rem]">
            Onde tem licitação de alimentos para você, e por quanto ela costuma ser ganha.
          </p>

          <div className="text-text-primary mt-10">
            <PreviaProduto vitrine={vitrine} />
          </div>

          {vitrine.precos ? (
            <dl className="mt-8 grid grid-cols-3 gap-3 [@media(max-height:820px)]:hidden">
              {[
                ['Licitações monitoradas', vitrine.licitacoes ?? 0, 'text-[#F2F4F7]'],
                ['Preços vencedores', vitrine.precos, 'text-[#F2F4F7]'],
                ['Abertas agora', vitrine.abertas ?? 0, 'text-[#34D399]'],
              ].map(([rotulo, valor, cor]) => (
                <div
                  key={rotulo as string}
                  className="rounded-card border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <dd
                    className={`numeros font-titulo text-[1.6rem] leading-none font-bold ${cor as string}`}
                  >
                    {formatarInteiro(valor as number)}
                  </dd>
                  <dt className="text-caption mt-2 text-[#98A2B3]">{rotulo as string}</dt>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="text-caption mt-4 text-[#98A2B3]">
            Dados oficiais do PNCP, atualizados a cada hora.
          </p>
        </div>
      </aside>
    </main>
  );
}
