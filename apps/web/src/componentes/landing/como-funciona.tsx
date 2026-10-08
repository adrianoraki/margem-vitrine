import { CabecalhoSecao } from './cabecalho-secao';
import { Container } from './container';

const PASSOS = [
  {
    n: '1',
    titulo: 'Crie a conta com seu e-mail',
    texto: 'Sem senha e sem cartão. Digite o CNPJ e a gente preenche razão social e atividade.',
  },
  {
    n: '2',
    titulo: 'Diga o que você vende',
    texto: 'Arroz, carnes, hortifruti, merenda. Escolha itens e UFs com um toque.',
  },
  {
    n: '3',
    titulo: 'Receba só o que vale a pena',
    texto:
      'O feed abre com as licitações abertas e o preço vencedor de cada item. Em menos de 3 minutos.',
  },
];

export function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-titulo"
      className="border-border bg-surface scroll-mt-20 border-t py-20 md:py-28"
    >
      <Container>
        <CabecalhoSecao
          id="como-titulo"
          rotulo="Como funciona"
          titulo="Do cadastro ao primeiro dado real em 3 minutos"
        />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {PASSOS.map((p) => (
            <li key={p.n} className="rounded-sheet border-border bg-bg relative border p-6">
              <span className="numeros bg-primary font-titulo text-small text-bg flex size-9 items-center justify-center rounded-full font-bold">
                {p.n}
              </span>
              <h3 className="text-h3 mt-5">{p.titulo}</h3>
              <p className="text-small text-text-secondary mt-1.5">{p.texto}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
