import Link from 'next/link';
import { Marca } from '../marca';
import { Container } from './container';

const COLUNAS = [
  {
    titulo: 'Produtos',
    links: [
      ['Margem Licita', '/#licita'],
      ['Margem Compras', '/#compras'],
      ['Preços', '/#precos'],
    ],
  },
  {
    titulo: 'Recursos',
    links: [
      ['Como funciona', '/#como-funciona'],
      ['Segurança', '/#seguranca'],
    ],
  },
  {
    titulo: 'Empresa',
    links: [
      ['Para contadores', '/#contadores'],
      ['Entrar', '/entrar'],
    ],
  },
  { titulo: 'Legal', links: [['Privacidade e LGPD', '/privacidade']] },
] as const;

export function Rodape() {
  return (
    <footer className="border-border bg-surface border-t pt-14 pb-10">
      <Container>
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Marca />
            <p className="text-small text-text-secondary mt-3 max-w-xs">
              Radar de licitações e painel de compras para pequenas empresas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-4">
            {COLUNAS.map((c) => (
              <div key={c.titulo}>
                <h2 className="text-small font-semibold">{c.titulo}</h2>
                <ul className="text-small text-text-secondary mt-3 grid gap-2">
                  {c.links.map(([rotulo, href]) => (
                    <li key={rotulo}>
                      <Link href={href} className="hover:text-text-primary">
                        {rotulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="border-border text-caption text-text-secondary mt-12 border-t pt-6">
          Margem é nome provisório. Dados de licitações: Portal Nacional de Contratações Públicas
          (PNCP), fonte pública.
        </p>
      </Container>
    </footer>
  );
}
