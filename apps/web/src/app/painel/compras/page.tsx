import { formatarCnpj, formatarMoeda } from '@margem/core';
import { Badge, Botao, Card } from '@margem/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { carregarCompras, temCompras } from '@/lib/compras';
import { sessaoComEmpresa } from '@/lib/sessao';
import { moedaCompacta } from '@/lib/texto';
import { revogarCertificado } from './acoes';
import { EnviarCertificado } from './certificado';
import { ImportarXml } from './importar-xml';

export const metadata: Metadata = { title: 'Compras — Margem', robots: { index: false } };

const data = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' });

export default async function Compras() {
  const { sb, empresa, plano, papel } = await sessaoComEmpresa();

  if (!temCompras(plano)) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-h1 font-bold tracking-tight">Compras</h1>
        <Card className="mt-6">
          <Badge tom="info">Compras Pro e Completo</Badge>
          <h2 className="text-h3 mt-3">Seu custo real, lido das notas fiscais</h2>
          <p className="text-body text-text-secondary mt-2">
            Com as notas de compra, o Margem calcula o custo de cada produto e mostra a sua margem
            em cada licitação. Disponível nos planos Compras Pro e Completo.
          </p>
          <Botao asChild variante="conversao" className="mt-5">
            <Link href="/#precos">Ver planos</Link>
          </Botao>
        </Card>
      </div>
    );
  }

  const { certificado, notas, totalNotas, custos } = await carregarCompras(sb, empresa.id);
  const vence = certificado ? new Date(certificado.valido_ate) : null;
  const diasParaVencer = vence ? Math.ceil((vence.getTime() - Date.now()) / 86_400_000) : null;

  return (
    <div>
      <h1 className="text-h1 font-bold tracking-tight">Compras</h1>
      <p className="text-body text-text-secondary mt-1 max-w-2xl">
        Suas notas de compra viram custo por produto. É esse custo que aparece como margem nas
        licitações do radar.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-h3">Importar XML das notas</h2>
          <p className="text-small text-text-secondary mt-1 mb-4">
            NF-e ou NFC-e de compra, do jeito que o fornecedor mandou (com ou sem o protocolo).
          </p>
          <ImportarXml />
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-h3">Certificado A1</h2>
            {certificado && (
              <Badge tom={diasParaVencer !== null && diasParaVencer < 30 ? 'atencao' : 'positivo'}>
                Ativo
              </Badge>
            )}
          </div>
          {certificado ? (
            <div className="mt-3">
              <dl className="text-small grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-text-secondary">Titular</dt>
                <dd>{certificado.titular_nome}</dd>
                <dt className="text-text-secondary">CNPJ</dt>
                <dd className="numeros">{formatarCnpj(certificado.cnpj)}</dd>
                <dt className="text-text-secondary">Válido até</dt>
                <dd className="numeros">
                  {data(certificado.valido_ate)}
                  {diasParaVencer !== null &&
                    diasParaVencer < 30 &&
                    ` (vence em ${diasParaVencer} dias)`}
                </dd>
              </dl>
              <p className="text-small text-text-secondary mt-4">
                A busca automática das notas na SEFAZ com o certificado entra na próxima etapa. Até
                lá, importe os XML ao lado.
              </p>
              {papel === 'dono' && (
                <form action={revogarCertificado} className="mt-4">
                  <input type="hidden" name="id" value={certificado.id} />
                  <Botao type="submit" variante="secundario">
                    Revogar certificado
                  </Botao>
                </form>
              )}
            </div>
          ) : papel === 'dono' ? (
            <div className="mt-3">
              <p className="text-small text-text-secondary mb-4">
                Com o e-CNPJ, o Margem vai buscar sozinho na SEFAZ as notas emitidas contra a sua
                empresa (a busca automática entra na próxima etapa).
              </p>
              <EnviarCertificado organizacao={empresa.id} />
            </div>
          ) : (
            <p className="text-small text-text-secondary mt-3">
              Só o dono da conta envia o certificado.
            </p>
          )}
        </Card>
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-h3">
            Seus custos <span className="numeros text-text-secondary">({custos.length})</span>
          </h2>
          <span className="text-caption text-text-secondary">
            Custo médio ponderado pela quantidade
          </span>
        </div>
        {custos.length ? (
          <div className="rounded-card border-border bg-surface mt-4 overflow-x-auto border">
            <table className="text-small w-full min-w-[640px]">
              <thead className="text-caption text-text-secondary border-border border-b text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 text-right font-semibold">Compras</th>
                  <th className="px-4 py-3 text-right font-semibold">Custo médio</th>
                  <th className="px-4 py-3 text-right font-semibold">Faixa</th>
                  <th className="px-4 py-3 text-right font-semibold">Última compra</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {custos.map((c) => (
                  <tr key={c.produto_id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.nome}</p>
                      <p className="text-caption text-text-secondary">{c.unidade?.toLowerCase()}</p>
                    </td>
                    <td className="numeros px-4 py-3 text-right">{c.compras}</td>
                    <td className="numeros px-4 py-3 text-right font-semibold">
                      {formatarMoeda(c.custo_medio)}
                    </td>
                    <td className="numeros text-text-secondary px-4 py-3 text-right whitespace-nowrap">
                      {c.custo_minimo === c.custo_maximo
                        ? '—'
                        : `${formatarMoeda(c.custo_minimo)} – ${formatarMoeda(c.custo_maximo)}`}
                    </td>
                    <td className="numeros text-text-secondary px-4 py-3 text-right">
                      {data(c.ultima_compra)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-card border-border text-small text-text-secondary mt-4 border border-dashed p-6">
            Importe as notas de compra para ver o custo de cada produto.
          </p>
        )}
      </section>

      {notas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h3">
            Notas importadas <span className="numeros text-text-secondary">({totalNotas})</span>
          </h2>
          <ul className="divide-border border-border rounded-card bg-surface mt-4 divide-y border">
            {notas.map((n) => (
              <li
                key={n.id}
                className="text-small flex flex-wrap items-baseline justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{n.fornecedores?.nome ?? 'Fornecedor'}</p>
                  <p className="text-caption text-text-secondary">
                    NF {n.numero}
                    {n.serie ? `/${n.serie}` : ''} · {data(n.emitida_em)} ·{' '}
                    {n.itens_compra[0]?.count ?? 0} itens
                  </p>
                </div>
                <span className="numeros font-semibold">
                  {moedaCompacta(Number(n.valor_total))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
