import { formatarMoeda } from '@margem/core';
import { Badge, cn } from '@margem/ui';
import type { ReactNode } from 'react';
import { CabecalhoSecao } from './cabecalho-secao';
import { Container } from './container';

function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="mt-1 size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 8.5l3 3 7-7" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

function CardProduto({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      className={cn(
        'group rounded-sheet border-border bg-surface ease-margem relative scroll-mt-24 overflow-hidden border p-6 shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-8',
        className,
      )}
    >
      {children}
    </article>
  );
}

/** Mini-gráfico decorativo de custo subindo (critical: aumento de preço é dinheiro contra o cliente). */
function LinhaAumento() {
  return (
    <svg aria-hidden viewBox="0 0 200 60" className="h-14 w-full" preserveAspectRatio="none">
      <path
        d="M0 48 L30 46 L60 47 L90 40 L120 38 L150 26 L180 20 L200 14"
        fill="none"
        stroke="var(--critical)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 48 L30 46 L60 47 L90 40 L120 38 L150 26 L180 20 L200 14 L200 60 L0 60Z"
        fill="var(--critical)"
        opacity="0.08"
      />
    </svg>
  );
}

/** Os dois produtos e a combinação, em mosaico: o tamanho do card diz a importância. */
export function Produtos() {
  return (
    <section
      id="produtos"
      aria-labelledby="produtos-titulo"
      className="scroll-mt-20 py-20 md:py-28"
    >
      <Container>
        <CabecalhoSecao
          id="produtos-titulo"
          rotulo="Dois produtos, uma conta"
          titulo="Cada um resolve um problema. Juntos, mostram a sua margem."
          apoio="Use só o que faz sentido para o seu negócio. Os dados de um enriquecem o outro."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <CardProduto id="licita" className="lg:col-span-7">
            <Badge tom="neutro">Margem Licita</Badge>
            <h3 className="text-h2 mt-4 font-semibold tracking-tight">
              Radar de licitações de alimentos, com o preço que ganha
            </h3>
            <p className="text-body text-text-secondary mt-2">
              “Onde tem licitação para mim e por quanto ela costuma ser ganha?” Para fornecedores de
              prefeituras e órgãos públicos do Nordeste.
            </p>
            <ul className="text-small text-text-secondary mt-6 grid gap-2.5 sm:grid-cols-2">
              <Check>Coleta do PNCP de hora em hora</Check>
              <Check>Filtro por item, UF e município</Check>
              <Check>Preço vencedor dos últimos 24 meses</Check>
              <Check>Funil: interesse, proposta, ganhou</Check>
              <Check>Alerta 48 h antes do prazo</Check>
              <Check>Resumo diário às 7h</Check>
            </ul>
            <div className="rounded-card border-border bg-bg mt-6 border p-4">
              <div className="flex items-center justify-between">
                <p className="text-small font-medium">Seu funil</p>
                <span className="text-caption text-text-secondary">Exemplo</span>
              </div>
              <ol className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  ['Interesse', 6, 'bg-border'],
                  ['Proposta', 3, 'bg-info/20'],
                  ['Ganhou', 2, 'bg-accent-soft'],
                  ['Perdeu', 1, 'bg-critical/10'],
                ].map(([rotulo, n, cor]) => (
                  <li key={rotulo} className={cn('rounded-input px-1 py-2.5', cor as string)}>
                    <span className="numeros text-h3 block font-bold">{n}</span>
                    <span className="text-caption text-text-secondary block truncate">
                      {rotulo}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </CardProduto>

          <CardProduto id="compras" className="lg:col-span-5">
            <Badge tom="neutro">Margem Compras</Badge>
            <h3 className="text-h2 mt-4 font-semibold tracking-tight">
              Descubra qual fornecedor aumentou seu preço
            </h3>
            <p className="text-body text-text-secondary mt-2">
              O custo real de cada produto, montado das suas notas fiscais. Para mercadinhos,
              padarias, restaurantes e distribuidoras.
            </p>
            <div className="rounded-card border-border bg-bg mt-6 border p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-small font-medium">Óleo de soja 900 ml</p>
                <Badge tom="critico" className="numeros">
                  +12% em 90 dias
                </Badge>
              </div>
              <LinhaAumento />
              <p className="text-caption text-text-secondary">
                Exemplo · último custo {formatarMoeda(7.89)}
              </p>
            </div>
          </CardProduto>

          <CardProduto className="bg-[#0B1220] text-[#F2F4F7] lg:col-span-12 [&_p]:text-[#98A2B3]">
            <div
              aria-hidden
              className="absolute -right-24 -bottom-40 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(52_211_153/0.25),transparent)]"
            />
            <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <span className="text-caption inline-flex h-6 items-center rounded-full bg-[#0F2A21] px-2.5 font-semibold text-[#34D399]">
                  Margem Completo
                </span>
                <h3 className="text-h2 mt-4 font-semibold tracking-tight">
                  A margem de cada licitação, antes de disputar
                </h3>
                <p className="text-body mt-2">
                  Para quem compra da indústria e vende ao governo: o preço vencedor médio da região
                  ao lado do seu custo real. O Margem só alerta onde vale a pena.
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-3">
                {[
                  ['Preço vencedor', 'R$ 6,40', 'text-[#F2F4F7]'],
                  ['Seu custo', 'R$ 5,20', 'text-[#F2F4F7]'],
                  ['Margem', '16–21%', 'text-[#34D399]'],
                ].map(([r, v, cor]) => (
                  <div
                    key={r}
                    className="rounded-card border border-white/10 bg-white/5 p-3 backdrop-blur md:p-4"
                  >
                    <dt className="text-caption text-[#98A2B3]">{r}</dt>
                    <dd
                      className={cn(
                        'numeros lg:text-kpi mt-1 text-[1.15rem] font-bold whitespace-nowrap sm:text-[1.5rem]',
                        cor,
                      )}
                    >
                      {v}
                    </dd>
                  </div>
                ))}
                <p className="text-caption col-span-3">
                  Exemplo por kg. A margem é sempre uma faixa, nunca promessa.
                </p>
              </dl>
            </div>
          </CardProduto>
        </div>
      </Container>
    </section>
  );
}
