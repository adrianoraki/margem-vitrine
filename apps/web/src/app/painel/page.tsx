import { formatarInteiro } from '@margem/core';
import { Badge, Botao, Card, cn } from '@margem/ui';
import Link from 'next/link';
import { CartaoLicitacao } from '@/componentes/painel/cartao-licitacao';
import { temCompras } from '@/lib/compras';
import { buscarOportunidades } from '@/lib/radar';
import { carregarSessao } from '@/lib/sessao';
import { moedaCompacta, prazoAte } from '@/lib/texto';

export default async function Inicio() {
  const { sb, empresa, regra, plano } = await carregarSessao();
  const notas = empresa
    ? await sb
        .schema('compras')
        .from('notas')
        .select('id', { count: 'exact', head: true })
        .eq('organizacao_id', empresa.id)
    : null;

  const passos = [
    {
      titulo: 'Cadastrar sua empresa',
      texto: 'Digite o CNPJ e a gente preenche o resto.',
      href: '/painel/empresa',
      feito: Boolean(empresa),
    },
    {
      titulo: 'Configurar o radar',
      texto: 'Escolha os itens e os estados que você atende.',
      href: '/painel/radar/configurar',
      feito: Boolean(regra),
    },
    {
      titulo: 'Conectar suas notas',
      texto: temCompras(plano)
        ? 'Certificado A1 ou upload de XML, para calcular sua margem.'
        : 'Nos planos Compras Pro e Completo: custo real e margem em cada licitação.',
      href: empresa ? '/painel/compras' : null,
      feito: (notas?.count ?? 0) > 0,
    },
  ];
  const proximo = passos.findIndex((p) => !p.feito && p.href);

  const radar = empresa && regra ? await buscarOportunidades(sb, regra, { limite: 50 }) : null;
  const funil = empresa
    ? await sb.schema('licita').from('funil').select('estagio').eq('organizacao_id', empresa.id)
    : null;
  const urgentes =
    radar?.lista.filter((o) =>
      o.data_encerramento_proposta ? prazoAte(o.data_encerramento_proposta).urgente : false,
    ).length ?? 0;
  const valorAberto =
    radar?.lista.reduce((s, o) => s + Number(o.valor_total_estimado ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="text-h1 font-bold tracking-tight">
        {empresa ? `Olá, ${empresa.nome_fantasia ?? empresa.razao_social}` : 'Bem-vindo ao Margem'}
      </h1>
      <p className="text-body text-text-secondary mt-2 max-w-xl">
        {radar
          ? 'O que o radar achou para você hoje.'
          : 'Sua conta está criada. Faltam poucos passos para o radar mostrar as licitações certas para você.'}
      </p>

      {radar && (
        <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ['Abertas no seu radar', formatarInteiro(radar.total), ''],
            ['Encerram em 48 h', formatarInteiro(urgentes), urgentes ? 'text-warning' : ''],
            ['Valor estimado aberto', valorAberto ? moedaCompacta(valorAberto) : '—', ''],
            ['No seu funil', formatarInteiro(funil?.data?.length ?? 0), ''],
          ].map(([rotulo, valor, cor]) => (
            <Card key={rotulo}>
              <dt className="text-caption text-text-secondary">{rotulo}</dt>
              <dd className={cn('numeros text-kpi mt-1 font-bold', cor)}>{valor}</dd>
            </Card>
          ))}
        </dl>
      )}

      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {passos.map((p, i) => (
          <li key={p.titulo} className="animate-entrar" style={{ animationDelay: `${i * 40}ms` }}>
            <Card className={cn('flex h-full flex-col', i === proximo && 'border-accent')}>
              <div className="flex items-center justify-between gap-2">
                <span className="numeros text-caption text-text-secondary font-semibold">
                  Passo {i + 1}
                </span>
                {p.feito ? (
                  <Badge tom="positivo">Feito</Badge>
                ) : !p.href ? (
                  <Badge tom="neutro">Em breve</Badge>
                ) : null}
              </div>
              <h2 className="text-h3 mt-2">{p.titulo}</h2>
              <p className="text-small text-text-secondary mt-1 flex-1">{p.texto}</p>
              {p.href && (
                <Botao
                  asChild
                  variante={i === proximo ? 'conversao' : 'secundario'}
                  className="mt-4 self-start"
                >
                  <Link href={p.href}>{p.feito ? 'Ajustar' : 'Começar →'}</Link>
                </Botao>
              )}
            </Card>
          </li>
        ))}
      </ol>

      {radar && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-h3">Prazo mais curto primeiro</h2>
            <Link
              href="/painel/radar"
              className="text-small text-accent underline-offset-2 hover:underline"
            >
              Ver radar completo →
            </Link>
          </div>
          {radar.lista.length ? (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {radar.lista.slice(0, 4).map((o) => (
                <li key={o.numero_controle_pncp}>
                  <CartaoLicitacao o={o} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-card border-border text-small text-text-secondary mt-4 border border-dashed p-6">
              Nenhuma licitação aberta com seus itens agora. As encerradas, com preço vencedor,
              estão no radar.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
