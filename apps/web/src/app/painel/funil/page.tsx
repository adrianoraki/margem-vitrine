import type { Metadata } from 'next';
import Link from 'next/link';
import { CartaoLicitacao, ROTULO_ESTAGIO } from '@/componentes/painel/cartao-licitacao';
import type { Oportunidade } from '@/lib/radar';
import { sessaoComEmpresa } from '@/lib/sessao';
import { moedaCompacta } from '@/lib/texto';

export const metadata: Metadata = { title: 'Funil — Margem', robots: { index: false } };

const ORDEM = ['interesse', 'proposta_enviada', 'ganhou', 'perdeu'] as const;

export default async function Funil() {
  const { sb, empresa } = await sessaoComEmpresa();
  const { data } = await sb
    .schema('licita')
    .from('funil')
    .select(
      'estagio, atualizado_em, contratacoes(numero_controle_pncp, orgao_razao_social, municipio, uf, objeto, modalidade_nome, valor_total_estimado, data_encerramento_proposta, termos_casados)',
    )
    .eq('organizacao_id', empresa.id)
    .order('atualizado_em', { ascending: false });

  type Linha = { estagio: string; contratacoes: Oportunidade | null };
  const linhas = ((data ?? []) as unknown as Linha[]).flatMap((l) =>
    l.contratacoes ? [{ estagio: l.estagio, c: l.contratacoes }] : [],
  );

  return (
    <div>
      <h1 className="text-h1 font-bold tracking-tight">Funil</h1>
      <p className="text-body text-text-secondary mt-1">
        As licitações que você está disputando, do interesse ao resultado.
      </p>
      {linhas.length === 0 ? (
        <p className="rounded-card border-border text-small text-text-secondary mt-8 border border-dashed p-6">
          Nada no funil ainda. No{' '}
          <Link href="/painel/radar" className="text-text-primary underline underline-offset-2">
            radar
          </Link>
          , abra uma licitação e marque “Tenho interesse”.
        </p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-4 lg:gap-4">
          {ORDEM.map((estagio) => {
            const doEstagio = linhas.filter((l) => l.estagio === estagio);
            const soma = doEstagio.reduce((s, l) => s + Number(l.c.valor_total_estimado ?? 0), 0);
            return (
              <section key={estagio} aria-labelledby={`col-${estagio}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 id={`col-${estagio}`} className="text-small font-semibold">
                    {ROTULO_ESTAGIO[estagio]}{' '}
                    <span className="numeros text-text-secondary">({doEstagio.length})</span>
                  </h2>
                  {soma > 0 && (
                    <span className="numeros text-caption text-text-secondary">
                      {moedaCompacta(soma)}
                    </span>
                  )}
                </div>
                <ul className="mt-3 grid gap-3">
                  {doEstagio.map((l) => (
                    <li key={l.c.numero_controle_pncp}>
                      <CartaoLicitacao o={l.c} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
