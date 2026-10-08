import { ComoFunciona } from '@/componentes/landing/como-funciona';
import { CtaFinal } from '@/componentes/landing/cta-final';
import { Faq } from '@/componentes/landing/faq';
import { Hero } from '@/componentes/landing/hero';
import { Navbar } from '@/componentes/landing/navbar';
import { Numeros } from '@/componentes/landing/numeros';
import { Precos } from '@/componentes/landing/precos';
import { Produtos } from '@/componentes/landing/produtos';
import { Rodape } from '@/componentes/landing/rodape';
import { Seguranca } from '@/componentes/landing/seguranca';
import { carregarVitrine } from '@/lib/vitrine';

// Página estática regenerada a cada 5 min (ISR): dado real sem custo por visita.
export const revalidate = 300;

export default async function Home() {
  const vitrine = await carregarVitrine();
  return (
    <>
      <Navbar />
      <main>
        <Hero vitrine={vitrine} />
        <Numeros vitrine={vitrine} />
        <Produtos />
        <ComoFunciona />
        <Seguranca />
        <Precos />
        <Faq />
        <CtaFinal />
      </main>
      <Rodape />
    </>
  );
}
