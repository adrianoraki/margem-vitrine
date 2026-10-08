import { CabecalhoSecao } from './cabecalho-secao';
import { Container } from './container';

const PERGUNTAS = [
  [
    'De onde vêm os dados de licitação?',
    'Do PNCP, o Portal Nacional de Contratações Públicas, fonte oficial e pública. Coletamos de hora em hora e guardamos os preços homologados de cada item.',
  ],
  [
    'Preciso enviar meu certificado digital?',
    'Só para o Margem Compras importar as notas sozinho. Quem prefere pode enviar os XMLs manualmente ou encaminhar por e-mail.',
  ],
  [
    'A margem estimada é garantida?',
    'Não. Ela é uma faixa calculada com o preço vencedor médio da região e o seu custo médio dos últimos 60 dias. Serve para decidir onde disputar, não é promessa.',
  ],
  [
    'Posso cancelar e levar meus dados?',
    'Sim. Você exporta tudo em CSV e pode pedir a exclusão. Dados de nota fiscal ficam retidos pelo prazo legal, sem seu nome, CPF ou e-mail.',
  ],
  [
    'Quais estados vocês cobrem?',
    'Começamos pela Paraíba e estamos expandindo para todo o Nordeste.',
  ],
];

export function Faq() {
  return (
    <section
      aria-labelledby="faq-titulo"
      className="border-border bg-surface border-t py-20 md:py-28"
    >
      <Container className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <CabecalhoSecao id="faq-titulo" rotulo="Perguntas frequentes" titulo="Antes de começar" />
        </div>
        <div className="divide-border border-border divide-y border-y lg:col-span-8">
          {PERGUNTAS.map(([p, r]) => (
            <details key={p} className="group py-1">
              <summary className="rounded-botao text-body focus-visible:ring-accent/40 flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium focus-visible:ring-[3px] focus-visible:outline-none">
                {p}
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="text-text-secondary size-5 shrink-0 transition-transform duration-200 group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M10 4v12M4 10h12" />
                </svg>
              </summary>
              <p className="text-small text-text-secondary pb-5">{r}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
