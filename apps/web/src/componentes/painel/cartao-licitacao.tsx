import { Badge, Card, cn } from '@margem/ui';
import Link from 'next/link';
import type { Oportunidade } from '@/lib/radar';
import { rotuloTermo } from '@/lib/termos';
import { capitalizarNome, limparObjeto, moedaCompacta, nomeOrgao, prazoAte } from '@/lib/texto';

export const ROTULO_ESTAGIO: Record<string, string> = {
  interesse: 'Interesse',
  proposta_enviada: 'Proposta enviada',
  ganhou: 'Ganhou',
  perdeu: 'Perdeu',
};

/** Link da página de uma licitação (o número de controle do PNCP tem "/" e "-"). */
export function hrefLicitacao(id: string): string {
  return `/painel/licitacoes/${encodeURIComponent(id)}`;
}

/** Cartão de licitação do radar e do funil. */
export function CartaoLicitacao({ o, estagio }: { o: Oportunidade; estagio?: string }) {
  const prazo = o.data_encerramento_proposta ? prazoAte(o.data_encerramento_proposta) : null;
  const municipio = capitalizarNome(o.municipio ?? '');
  const orgao = nomeOrgao(o.orgao_razao_social, municipio);
  return (
    <Link
      href={hrefLicitacao(o.numero_controle_pncp)}
      className="rounded-card focus-visible:ring-accent/40 block focus-visible:ring-[3px] focus-visible:outline-none"
    >
      <Card clicavel className="h-full">
        <div className="flex flex-wrap items-center gap-2">
          {prazo && prazo.texto !== 'encerrada' ? (
            <Badge tom={prazo.urgente ? 'atencao' : 'positivo'}>
              {prazo.urgente ? prazo.texto : `Proposta ${prazo.texto}`}
            </Badge>
          ) : (
            <Badge tom="neutro">Encerrada</Badge>
          )}
          {o.modalidade_nome && <Badge tom="neutro">{o.modalidade_nome.replace(' - ', ' ')}</Badge>}
          {estagio && <Badge tom="info">{ROTULO_ESTAGIO[estagio]}</Badge>}
        </div>
        <h2 className="text-body mt-3 line-clamp-2 font-semibold">{limparObjeto(o.objeto)}</h2>
        <p className="text-small text-text-secondary mt-1 truncate">
          {orgao.startsWith('Prefeitura de')
            ? `${orgao}, ${o.uf}`
            : `${orgao} · ${municipio}, ${o.uf}`}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {o.termos_casados.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-caption border-border text-text-secondary rounded-full border px-2 py-0.5"
              >
                {rotuloTermo(t)}
              </span>
            ))}
          </div>
          <p className={cn('numeros shrink-0 text-right font-bold')}>
            {o.valor_total_estimado ? moedaCompacta(Number(o.valor_total_estimado)) : '—'}
          </p>
        </div>
      </Card>
    </Link>
  );
}
