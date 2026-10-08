import { Container } from './container';

const PONTOS = [
  [
    'Cofre criptografado',
    'O certificado A1 vai direto para o servidor e fica cifrado no Supabase Vault. Nunca volta ao navegador.',
  ],
  [
    'Acesso auditado',
    'Só a função que busca suas notas na Receita consegue usá-lo, e cada uso fica registrado.',
  ],
  ['Você no controle', 'Revogue o acesso a qualquer momento. Prefere não enviar? Mande os XMLs.'],
  ['Dados no Brasil', 'Banco e aplicação em São Paulo. Tratamento conforme a LGPD.'],
];

export function Seguranca() {
  return (
    <section
      id="seguranca"
      aria-labelledby="seguranca-titulo"
      className="scroll-mt-20 py-20 md:py-28"
    >
      <Container className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-small text-text-secondary font-semibold">Segurança</p>
          <h2
            id="seguranca-titulo"
            className="mt-2 text-[1.75rem] leading-tight font-bold tracking-[-0.02em] md:text-[2.25rem]"
          >
            Seu certificado é tratado como o dado mais sensível do sistema
          </h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          {PONTOS.map(([t, d]) => (
            <li key={t} className="rounded-card border-border bg-surface border p-5">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="text-text-primary size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              >
                <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
                <path d="m9 12 2 2 4-4" strokeLinecap="round" />
              </svg>
              <h3 className="text-body mt-3 font-semibold">{t}</h3>
              <p className="text-small text-text-secondary mt-1">{d}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
