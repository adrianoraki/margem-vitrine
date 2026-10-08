import { Botao } from '@margem/ui';
import Link from 'next/link';
import { Container } from './container';

export function CtaFinal() {
  return (
    <section id="contadores" aria-labelledby="cta-titulo" className="scroll-mt-20 py-20 md:py-28">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[28px] bg-[#0B1220] px-6 py-14 text-center text-[#F2F4F7] md:px-16 md:py-20">
          <div aria-hidden className="fundo-grade absolute inset-0 -z-10 text-white opacity-30" />
          <div
            aria-hidden
            className="absolute -top-40 left-1/2 -z-10 size-[560px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(52_211_153/0.3),transparent)]"
          />
          <h2
            id="cta-titulo"
            className="mx-auto max-w-2xl text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-balance md:text-[2.5rem]"
          >
            Veja hoje as licitações que combinam com você
          </h2>
          <p className="text-body mx-auto mt-4 max-w-xl text-[#98A2B3]">
            Crie a conta em menos de um minuto. É contador? Indique o Margem Compras aos seus
            clientes e receba comissão recorrente.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Botao asChild variante="conversao" className="h-12 px-6 md:h-12">
              <Link href="/entrar">Criar conta grátis</Link>
            </Botao>
            <Botao
              asChild
              className="h-12 border border-white/15 bg-white/5 px-6 text-[#F2F4F7] hover:bg-white/10 md:h-12"
            >
              <Link href="/entrar?next=%2Fpainel%3Fcontador%3D1">Sou contador</Link>
            </Botao>
          </div>
        </div>
      </Container>
    </section>
  );
}
