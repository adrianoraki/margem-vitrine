import type { Vitrine } from '@/lib/vitrine';
import { Container } from './container';
import { NumeroAnimado } from './numero-animado';

/** Faixa de prova: números reais da coleta. Some inteira se o banco não responder. */
export function Numeros({ vitrine }: { vitrine: Vitrine }) {
  if (vitrine.licitacoes === null || vitrine.precos === null) return null;
  const itens = [
    { valor: vitrine.licitacoes, rotulo: 'licitações de alimentos monitoradas' },
    { valor: vitrine.precos, rotulo: 'preços vencedores por item' },
    { valor: vitrine.abertas ?? 0, rotulo: 'abertas para proposta agora' },
    { valor: 24, rotulo: 'coletas por dia, direto do PNCP' },
  ];
  return (
    <section aria-label="O Margem em números" className="border-border bg-surface border-y">
      <Container>
        <dl className="divide-border grid grid-cols-2 md:grid-cols-4 md:divide-x">
          {itens.map((i) => (
            <div key={i.rotulo} className="px-2 py-6 md:px-6 md:py-8">
              <dd className="numeros font-titulo text-kpi font-bold tracking-tight">
                <NumeroAnimado valor={i.valor} />
              </dd>
              <dt className="text-small text-text-secondary mt-1">{i.rotulo}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
