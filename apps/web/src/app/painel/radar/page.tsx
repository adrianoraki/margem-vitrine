import { Botao } from '@margem/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CartaoLicitacao } from '@/componentes/painel/cartao-licitacao';
import { buscarOportunidades } from '@/lib/radar';
import { sessaoComEmpresa } from '@/lib/sessao';
import { rotuloTermo } from '@/lib/termos';

export const metadata: Metadata = { title: 'Radar — Margem', robots: { index: false } };

export default async function Radar() {
  const { sb, empresa, regra } = await sessaoComEmpresa();
  if (!regra) redirect('/painel/radar/configurar');

  const [abertas, encerradas, funil] = await Promise.all([
    buscarOportunidades(sb, regra),
    buscarOportunidades(sb, regra, { encerradas: true, limite: 12 }),
    sb
      .schema('licita')
      .from('funil')
      .select('numero_controle_pncp, estagio')
      .eq('organizacao_id', empresa.id),
  ]);
  const estagios = new Map((funil.data ?? []).map((f) => [f.numero_controle_pncp, f.estagio]));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold tracking-tight">Radar</h1>
          <p className="text-body text-text-secondary mt-1">
            {regra.termos.length} {regra.termos.length === 1 ? 'item' : 'itens'} ·{' '}
            {regra.ufs.length ? regra.ufs.join(', ') : 'Nordeste inteiro'}
          </p>
        </div>
        <Botao asChild variante="secundario">
          <Link href="/painel/radar/configurar">Ajustar radar</Link>
        </Botao>
      </div>
      <p className="text-caption text-text-secondary mt-3 line-clamp-2">
        {regra.termos.map(rotuloTermo).join(' · ')}
      </p>

      <section className="mt-8">
        <h2 className="text-h3">
          Abertas agora <span className="numeros text-text-secondary">({abertas.total})</span>
        </h2>
        {abertas.lista.length ? (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {abertas.lista.map((o) => (
              <li key={o.numero_controle_pncp}>
                <CartaoLicitacao o={o} estagio={estagios.get(o.numero_controle_pncp)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-card border-border text-small text-text-secondary mt-4 border border-dashed p-6">
            Nenhuma licitação aberta com esses itens agora. O radar confere o PNCP a cada hora; vale
            ampliar itens ou estados enquanto isso.
          </p>
        )}
      </section>

      {encerradas.lista.length > 0 && (
        <section className="mt-12">
          <h2 className="text-h3">Encerradas recentemente</h2>
          <p className="text-small text-text-secondary mt-1">
            Servem de régua: abra para ver por quanto cada item foi ganho.
          </p>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {encerradas.lista.map((o) => (
              <li key={o.numero_controle_pncp}>
                <CartaoLicitacao o={o} estagio={estagios.get(o.numero_controle_pncp)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
