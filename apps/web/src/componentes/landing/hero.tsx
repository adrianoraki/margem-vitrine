import { formatarInteiro, formatarMoeda } from '@margem/core';
import { Badge, Botao, cn } from '@margem/ui';
import Link from 'next/link';
import type { Vitrine } from '@/lib/vitrine';
import { moedaCompacta, prazoAte } from '@/lib/texto';
import { Container } from './container';

/** Hero: proposta à esquerda, o produto funcionando (com dado real) à direita. */
export function Hero({ vitrine }: { vitrine: Vitrine }) {
  return (
    <section className="relative isolate overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
      <div aria-hidden className="fundo-grade text-text-secondary absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute -top-48 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--accent-soft),transparent)] opacity-90"
      />
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          {vitrine.abertas !== null && vitrine.abertas > 0 && (
            <a
              href="#produtos"
              className="animate-entrar border-border bg-surface/80 text-small hover:border-text-secondary/30 inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1.5 shadow-sm backdrop-blur"
            >
              <span className="bg-accent-soft relative flex size-5 items-center justify-center rounded-full">
                <span className="bg-accent absolute inline-flex size-2 animate-ping rounded-full opacity-60 motion-reduce:hidden" />
                <span className="bg-accent relative inline-flex size-2 rounded-full" />
              </span>
              <span>
                <strong className="numeros font-semibold">
                  {formatarInteiro(vitrine.abertas)}
                </strong>{' '}
                licitações de alimentos abertas no Nordeste hoje
              </span>
              <span aria-hidden className="text-text-secondary">
                →
              </span>
            </a>
          )}
          <h1
            className="animate-entrar mt-6 text-[2.5rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance sm:text-5xl md:text-[3.5rem]"
            style={{ animationDelay: '40ms' }}
          >
            Venda para o governo sabendo{' '}
            <span className="text-text-secondary">quanto vai sobrar.</span>
          </h1>
          <p
            className="animate-entrar text-body text-text-secondary mt-5 max-w-xl md:text-[18px] md:leading-7"
            style={{ animationDelay: '80ms' }}
          >
            O Margem acha as licitações de alimentos certas para você, mostra por quanto cada item
            costuma ser ganho e compara com o custo real das suas compras, lido direto das notas
            fiscais.
          </p>
          <div
            className="animate-entrar mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: '120ms' }}
          >
            <Botao asChild variante="conversao" className="h-12 px-6 md:h-12">
              <Link href="/entrar">Criar conta grátis</Link>
            </Botao>
            <Botao asChild variante="secundario" className="h-12 px-6 md:h-12">
              <a href="#como-funciona">Ver como funciona</a>
            </Botao>
          </div>
          <p
            className="animate-entrar text-caption text-text-secondary mt-4"
            style={{ animationDelay: '160ms' }}
          >
            Sem cartão. Plano gratuito para sempre, 14 dias de teste nos planos pagos.
          </p>
        </div>

        <div className="lg:col-span-6">
          <PreviaProduto vitrine={vitrine} />
        </div>
      </Container>
    </section>
  );
}

/** Mosaico (bento) no formato do dashboard: o card maior é a melhor oportunidade do dia. */
export function PreviaProduto({ vitrine }: { vitrine: Vitrine }) {
  const { destaque, precosRecentes } = vitrine;
  const prazo = destaque ? prazoAte(destaque.encerramento) : null;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="from-accent/10 to-info/10 absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br via-transparent blur-2xl"
      />
      <div className="rounded-sheet border-border bg-surface-raised/90 border p-3 shadow-lg backdrop-blur sm:p-4">
        <div className="flex items-center justify-between px-1 pb-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="bg-border size-2.5 rounded-full" />
            <span className="bg-border size-2.5 rounded-full" />
            <span className="bg-border size-2.5 rounded-full" />
          </div>
          <span className="text-caption text-text-secondary">
            {vitrine.atualizadoEm ? 'Dados reais do PNCP, atualizados a cada hora' : 'Exemplo'}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-5">
          {destaque ? (
            <article
              className="animate-entrar rounded-card border-border bg-surface relative overflow-hidden border p-4 sm:col-span-5 sm:p-5"
              style={{ animationDelay: '120ms' }}
            >
              <div
                aria-hidden
                className="absolute -top-16 -right-16 size-48 rounded-full bg-[radial-gradient(closest-side,var(--accent-soft),transparent)]"
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tom="positivo">Aberta</Badge>
                  {destaque.modalidade && (
                    <Badge tom="neutro">{destaque.modalidade.replace(' - ', ' ')}</Badge>
                  )}
                  <span className="text-caption text-text-secondary ml-auto">
                    Maior oportunidade aberta
                  </span>
                </div>
                <h2 className="text-h3 mt-3 line-clamp-2">{destaque.objeto}</h2>
                <p className="text-small text-text-secondary mt-1">
                  {destaque.orgao.startsWith('Prefeitura de')
                    ? `${destaque.orgao}, ${destaque.uf}`
                    : `${destaque.orgao} · ${destaque.municipio}, ${destaque.uf}`}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-caption text-text-secondary">Valor estimado</dt>
                    <dd className="numeros sm:text-kpi text-[1.5rem] font-bold whitespace-nowrap">
                      {destaque.valorEstimado ? moedaCompacta(destaque.valorEstimado) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-caption text-text-secondary">Proposta</dt>
                    <dd
                      className={cn(
                        'numeros sm:text-kpi text-[1.5rem] font-bold whitespace-nowrap',
                        prazo?.urgente && 'text-warning',
                      )}
                    >
                      {prazo?.texto}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ) : null}

          {precosRecentes.length > 0 && (
            <article
              className="animate-entrar rounded-card border-border bg-surface border p-4 sm:col-span-3"
              style={{ animationDelay: '180ms' }}
            >
              <h2 className="text-small font-semibold">Preço vencedor, homologado</h2>
              <ul className="divide-border mt-3 divide-y">
                {precosRecentes.map((p) => (
                  <li
                    key={p.item + p.municipio}
                    className="flex items-baseline justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-small truncate">{p.item}</p>
                      <p className="text-caption text-text-secondary truncate">
                        {p.municipio}, {p.uf}
                        {p.unidade ? ` · ${p.unidade.toLowerCase()}` : ''}
                      </p>
                    </div>
                    <span className="numeros text-body shrink-0 font-semibold">
                      {formatarMoeda(p.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          )}

          <article
            className={cn(
              'animate-entrar rounded-card border-border bg-surface flex flex-col border p-4',
              precosRecentes.length > 0 ? 'sm:col-span-2' : 'sm:col-span-5',
            )}
            style={{ animationDelay: '240ms' }}
          >
            <h2 className="text-small font-semibold">Sua margem estimada</h2>
            <p className="text-caption text-text-secondary mt-auto pt-6">
              Preço vencedor × seu custo
            </p>
            <p className="numeros text-kpi text-accent font-bold">16–21%</p>
            <div aria-hidden className="bg-accent-soft mt-3 h-2 overflow-hidden rounded-full">
              <div className="bg-accent h-full w-[62%] rounded-full" />
            </div>
            <p className="text-caption text-text-secondary mt-2">Exemplo · Margem Completo</p>
          </article>
        </div>
      </div>
    </div>
  );
}
