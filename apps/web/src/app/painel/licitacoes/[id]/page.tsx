import { formatarMoeda } from '@margem/core';
import { classificarMargem } from '@margem/core';
import { Badge, Botao, Card, cn } from '@margem/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ROTULO_ESTAGIO } from '@/componentes/painel/cartao-licitacao';
import { custosDaEmpresa, temCompras } from '@/lib/compras';
import { custoDoItem, margemDoItem, type Vinculo } from '@/lib/margem-item';
import { chaveReferencia, referenciasPorTermo, type Referencia } from '@/lib/precos';
import { carregarLicitacao, precosHomologados } from '@/lib/radar';
import { sessaoComEmpresa } from '@/lib/sessao';
import { rotuloTermo } from '@/lib/termos';
import {
  capitalizarNome,
  limparObjeto,
  moedaCompacta,
  nomeItem,
  nomeOrgao,
  prazoAte,
} from '@/lib/texto';
import { atualizarFunil } from '../../funil/acoes';
import { salvarVinculo } from './acoes';

export const metadata: Metadata = { title: 'Licitação — Margem', robots: { index: false } };

/** Só links http(s) do sistema de origem viram âncora (nada de javascript:). */
function linkSeguro(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export default async function Licitacao({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id);
  const { sb, empresa, plano } = await sessaoComEmpresa();
  const comCompras = temCompras(plano);
  const { contratacao: c, itens } = await carregarLicitacao(sb, id);
  if (!c) notFound();

  const termos = [...new Set(itens.flatMap((i) => i.termos_casados))];
  const [precos, vencedores, noFunil, custos60, custosTodos, vinculosRes] = await Promise.all([
    precosHomologados(sb, termos),
    sb
      .schema('licita')
      .from('resultados')
      .select('numero_item, valor_unitario_homologado, fornecedor_nome')
      .eq('numero_controle_pncp', id)
      .eq('tipo_pessoa', 'PJ'),
    sb
      .schema('licita')
      .from('funil')
      .select('estagio')
      .eq('organizacao_id', empresa.id)
      .eq('numero_controle_pncp', id)
      .maybeSingle(),
    comCompras ? custosDaEmpresa(sb, empresa.id, 60) : [],
    comCompras ? custosDaEmpresa(sb, empresa.id, 3650) : [],
    comCompras
      ? sb
          .schema('compras')
          .from('vinculos_licitacao')
          .select('descricao_normalizada, produto_id, fator_conversao')
          .eq('organizacao_id', empresa.id)
          .limit(5000)
      : null,
  ]);
  // Custo dos últimos 60 dias (RF-31); produto sem compra recente usa o histórico inteiro.
  const recentes = new Set(custos60.map((c) => c.produto_id));
  const custos = [...custos60, ...custosTodos.filter((c) => !recentes.has(c.produto_id))];
  const vinculos = new Map<string, Vinculo>(
    (vinculosRes?.data ?? []).map((v) => [
      v.descricao_normalizada,
      { produto_id: v.produto_id, fator_conversao: Number(v.fator_conversao) },
    ]),
  );
  const refs = referenciasPorTermo(precos);
  const vencedor = new Map(
    (vencedores.data ?? []).map((v) => [v.numero_item, Number(v.valor_unitario_homologado)]),
  );

  const referencia = (termosItem: string[], unidade: string | null): Referencia | null => {
    let melhor: Referencia | null = null;
    for (const t of termosItem) {
      const r = refs.get(chaveReferencia(t, unidade));
      if (r && (!melhor || r.amostras > melhor.amostras)) melhor = r;
    }
    return melhor;
  };

  const prazo = c.data_encerramento_proposta ? prazoAte(c.data_encerramento_proposta) : null;
  const municipio = capitalizarNome(c.municipio ?? '');
  const link = linkSeguro(c.link_sistema_origem);
  const estagio = noFunil.data?.estagio;

  return (
    <div>
      <Link href="/painel/radar" className="text-small text-text-secondary hover:text-text-primary">
        ← Radar
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {prazo && prazo.texto !== 'encerrada' ? (
          <Badge tom={prazo.urgente ? 'atencao' : 'positivo'}>Proposta {prazo.texto}</Badge>
        ) : (
          <Badge tom="neutro">Encerrada</Badge>
        )}
        {c.modalidade_nome && <Badge tom="neutro">{c.modalidade_nome}</Badge>}
        {c.numero_compra && (
          <span className="text-caption text-text-secondary">Nº {c.numero_compra}</span>
        )}
      </div>
      <h1 className="text-h2 mt-3 max-w-4xl font-bold tracking-tight">{limparObjeto(c.objeto)}</h1>
      <p className="text-body text-text-secondary mt-2">
        {nomeOrgao(c.orgao_razao_social, municipio)} · {municipio}, {c.uf}
        {c.unidade_nome ? ` · ${capitalizarNome(c.unidade_nome)}` : ''}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-caption text-text-secondary">Valor estimado</p>
          <p className="numeros text-kpi font-bold">
            {c.valor_total_estimado ? moedaCompacta(Number(c.valor_total_estimado)) : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-caption text-text-secondary">Encerramento das propostas</p>
          <p className="numeros text-h3 mt-1 font-bold">
            {c.data_encerramento_proposta
              ? new Date(c.data_encerramento_proposta).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: 'America/Fortaleza',
                })
              : '—'}
          </p>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-small text-accent mt-2 inline-block underline underline-offset-2"
            >
              Abrir no sistema de origem ↗
            </a>
          )}
        </Card>
        <Card>
          <p className="text-caption text-text-secondary">Seu funil</p>
          <form action={atualizarFunil} className="mt-2 flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={id} />
            {estagio ? (
              <>
                <select
                  name="estagio"
                  defaultValue={estagio}
                  aria-label="Estágio no funil"
                  className="rounded-input border-border bg-surface text-small h-10 border px-2"
                >
                  {Object.entries(ROTULO_ESTAGIO).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                  <option value="remover">Tirar do funil</option>
                </select>
                <Botao type="submit" variante="secundario" className="h-10 md:h-10">
                  Atualizar
                </Botao>
              </>
            ) : (
              <Botao type="submit" name="estagio" value="interesse" variante="conversao">
                Tenho interesse
              </Botao>
            )}
          </form>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-h3">
          Itens <span className="numeros text-text-secondary">({itens.length})</span>
        </h2>
        <p className="text-small text-text-secondary mt-1">
          Referência: mediana dos preços vencedores homologados no PNCP para o mesmo item e a mesma
          unidade.
          {comCompras &&
            (custos.length
              ? ' Margem = (preço − seu custo) ÷ preço. Confira a unidade: se o item é por fardo e você compra por pacote, informe quantos pacotes há no fardo.'
              : ' Importe suas notas em Compras para ver seu custo e sua margem em cada item.')}
        </p>
        <div className="rounded-card border-border bg-surface mt-4 overflow-x-auto border">
          <table
            className={cn('text-small w-full', comCompras ? 'min-w-[980px]' : 'min-w-[720px]')}
          >
            <thead className="text-caption text-text-secondary border-border border-b text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 text-right font-semibold">Qtd.</th>
                <th className="px-4 py-3 text-right font-semibold">Estimado (un.)</th>
                <th className="px-4 py-3 text-right font-semibold">Referência (un.)</th>
                <th className="px-4 py-3 text-right font-semibold">Vencedor (un.)</th>
                {comCompras && (
                  <>
                    <th className="px-4 py-3 text-right font-semibold">Seu custo (un.)</th>
                    <th className="px-4 py-3 text-right font-semibold">Margem</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {itens.map((i) => {
                const ref = referencia(i.termos_casados, i.unidade_medida);
                const venc = vencedor.get(i.numero_item);
                const custo = comCompras ? custoDoItem(i, vinculos, custos) : null;
                const margem = margemDoItem(custo, {
                  referencia: ref?.mediana,
                  vencedor: venc,
                  estimado: i.valor_unitario_estimado ? Number(i.valor_unitario_estimado) : null,
                });
                const classe = margem ? classificarMargem(margem.faixa.central) : null;
                return (
                  <tr key={i.numero_item} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        <span className="numeros text-text-secondary mr-2">{i.numero_item}</span>
                        {nomeItem(i.descricao)}
                      </p>
                      <p className="text-caption text-text-secondary mt-0.5 line-clamp-2 max-w-xl">
                        {i.descricao}
                      </p>
                      {i.termos_casados.length > 0 && (
                        <p className="text-caption text-accent mt-1">
                          {i.termos_casados.map(rotuloTermo).join(' · ')}
                        </p>
                      )}
                      {comCompras && custos.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-caption text-text-secondary hover:text-text-primary cursor-pointer">
                            {custo && !custo.sugerido
                              ? 'Trocar produto vinculado'
                              : 'Vincular a um produto que você compra'}
                          </summary>
                          <form
                            action={salvarVinculo}
                            className="mt-2 flex flex-wrap items-end gap-2"
                          >
                            <input type="hidden" name="licitacao" value={id} />
                            <input type="hidden" name="descricao" value={i.descricao} />
                            <input type="hidden" name="unidade" value={i.unidade_medida ?? ''} />
                            <label className="text-caption grid gap-1">
                              Produto
                              <select
                                name="produto"
                                defaultValue={custo?.produto.produto_id ?? ''}
                                className="rounded-input border-border bg-surface text-small h-9 max-w-64 border px-2"
                              >
                                <option value="">— nenhum —</option>
                                {custos.map((c) => (
                                  <option key={c.produto_id} value={c.produto_id}>
                                    {c.nome} ({c.unidade?.toLowerCase()})
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-caption grid gap-1">
                              Unidades do produto por {i.unidade_medida?.toLowerCase() ?? 'unidade'}
                              <input
                                name="fator"
                                type="number"
                                step="any"
                                min="0.000001"
                                defaultValue={custo?.fator ?? 1}
                                className="rounded-input border-border bg-surface text-small numeros h-9 w-28 border px-2"
                              />
                            </label>
                            <Botao type="submit" variante="secundario" className="h-9 md:h-9">
                              Salvar
                            </Botao>
                          </form>
                        </details>
                      )}
                    </td>
                    <td className="numeros px-4 py-3 text-right whitespace-nowrap">
                      {i.quantidade ? Number(i.quantidade).toLocaleString('pt-BR') : '—'}{' '}
                      <span className="text-text-secondary">{i.unidade_medida?.toLowerCase()}</span>
                    </td>
                    <td className="numeros px-4 py-3 text-right whitespace-nowrap">
                      {i.valor_unitario_estimado
                        ? formatarMoeda(Number(i.valor_unitario_estimado))
                        : '—'}
                    </td>
                    <td className="numeros px-4 py-3 text-right whitespace-nowrap">
                      {ref ? (
                        <>
                          <span className="font-semibold">{formatarMoeda(ref.mediana)}</span>
                          <span className="text-caption text-text-secondary block">
                            {ref.amostras} {ref.amostras === 1 ? 'preço' : 'preços'}
                          </span>
                        </>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="numeros px-4 py-3 text-right whitespace-nowrap">
                      {venc ? (
                        <span className="text-accent font-semibold">{formatarMoeda(venc)}</span>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                    {comCompras && (
                      <>
                        <td className="numeros px-4 py-3 text-right whitespace-nowrap">
                          {custo ? (
                            <>
                              <span className="font-semibold">{formatarMoeda(custo.medio)}</span>
                              <span
                                className="text-caption text-text-secondary block max-w-40 truncate"
                                title={custo.produto.nome}
                              >
                                {custo.sugerido ? 'sugerido: ' : ''}
                                {custo.produto.nome}
                              </span>
                            </>
                          ) : (
                            <span className="text-text-secondary">—</span>
                          )}
                        </td>
                        <td className="numeros px-4 py-3 text-right whitespace-nowrap">
                          {margem ? (
                            <span
                              title={`De ${Math.round(margem.faixa.minima * 100)}% a ${Math.round(margem.faixa.maxima * 100)}%, sobre o preço ${margem.base}`}
                            >
                              <span
                                className={cn(
                                  'font-bold',
                                  classe === 'positiva' && 'text-accent',
                                  classe === 'apertada' && 'text-warning',
                                  classe === 'negativa' && 'text-critical',
                                )}
                              >
                                {Math.round(margem.faixa.central * 100)}%
                              </span>
                              <span className="text-caption text-text-secondary block">
                                sobre {margem.base}
                              </span>
                            </span>
                          ) : (
                            <span className="text-text-secondary">—</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
