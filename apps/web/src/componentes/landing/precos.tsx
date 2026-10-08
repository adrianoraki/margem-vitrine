import { Botao, cn } from '@margem/ui';
import Link from 'next/link';
import { CabecalhoSecao } from './cabecalho-secao';
import { Container } from './container';

const PLANOS = [
  {
    nome: 'Free',
    preco: 'R$ 0',
    para: 'Para conhecer',
    itens: [
      '1 palavra-chave e 1 UF',
      'Resumo semanal por e-mail',
      'Últimos 3 preços vencedores',
      'Até 20 XML/mês, painel de 30 dias',
    ],
  },
  {
    nome: 'Licita Pro',
    preco: 'R$ 79',
    para: 'Para quem vende ao governo',
    itens: [
      'Palavras-chave e UFs ilimitadas',
      'Alertas diários por push e e-mail',
      'Histórico completo de preços',
      'Funil de propostas',
    ],
  },
  {
    nome: 'Compras Pro',
    preco: 'R$ 99',
    para: 'Para quem quer comprar melhor',
    itens: [
      'Importação automática via certificado',
      'Alertas de aumento de custo',
      'Histórico ilimitado',
      'Até 3 usuários',
    ],
  },
  {
    nome: 'Margem Completo',
    preco: 'R$ 149',
    para: 'Para quem compra e vende',
    destaque: true,
    itens: [
      'Tudo do Licita Pro',
      'Tudo do Compras Pro',
      'Margem estimada por licitação',
      'Alerta só onde a margem compensa',
    ],
  },
];

export function Precos() {
  return (
    <section
      id="precos"
      aria-labelledby="precos-titulo"
      className="border-border scroll-mt-20 border-t py-20 md:py-28"
    >
      <Container>
        <CabecalhoSecao
          id="precos-titulo"
          rotulo="Preços"
          titulo="Comece grátis. Pague quando o Margem se pagar."
          apoio="14 dias de teste em qualquer plano pago. Pix, boleto ou cartão. Cancele quando quiser."
          centro
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANOS.map((p) => (
            <article
              key={p.nome}
              className={cn(
                'rounded-sheet bg-surface relative flex flex-col border p-6 shadow-sm',
                p.destaque ? 'border-accent ring-accent-soft shadow-md ring-4' : 'border-border',
              )}
            >
              {p.destaque && (
                <span className="bg-accent text-caption absolute -top-3 left-6 rounded-full px-2.5 py-0.5 font-semibold text-white">
                  Mais completo
                </span>
              )}
              <h3 className="text-h3">{p.nome}</h3>
              <p className="text-small text-text-secondary">{p.para}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="numeros font-titulo text-kpi font-bold tracking-tight">
                  {p.preco}
                </span>
                {p.preco !== 'R$ 0' && <span className="text-small text-text-secondary">/mês</span>}
              </p>
              <ul className="text-small text-text-secondary mt-5 grid flex-1 gap-2.5">
                {p.itens.map((i) => (
                  <li key={i} className="flex gap-2">
                    <svg
                      aria-hidden
                      viewBox="0 0 16 16"
                      className="text-text-primary mt-0.5 size-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 8.5l3 3 7-7" />
                    </svg>
                    {i}
                  </li>
                ))}
              </ul>
              <Botao
                asChild
                variante={p.destaque ? 'conversao' : 'secundario'}
                className="mt-6 w-full"
              >
                <Link href="/entrar">
                  {p.preco === 'R$ 0' ? 'Começar grátis' : 'Testar 14 dias'}
                </Link>
              </Botao>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
