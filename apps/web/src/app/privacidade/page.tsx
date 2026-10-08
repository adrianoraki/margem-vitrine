import type { Metadata } from 'next';
import { Container } from '@/componentes/landing/container';
import { Navbar } from '@/componentes/landing/navbar';
import { Rodape } from '@/componentes/landing/rodape';

export const metadata: Metadata = { title: 'Privacidade e LGPD — Margem' };

// Resumo em linguagem simples. A Política de Privacidade e os Termos de Uso formais estão
// pendentes de revisão por advogado antes do primeiro cliente pagante (docs/lgpd.md).
export default function Privacidade() {
  return (
    <>
      <Navbar />
      <main>
        <Container className="max-w-3xl py-16">
          <h1 className="text-h1 font-bold">Privacidade e LGPD</h1>
          <p className="text-small text-warning mt-2">
            Rascunho em revisão jurídica. A política formal sai antes do lançamento.
          </p>
          <div className="text-body text-text-secondary mt-8 grid gap-6">
            <section>
              <h2 className="text-h3 text-text-primary">O que coletamos e para quê</h2>
              <p>
                Nome, e-mail e dados da empresa de quem se cadastra, para executar o contrato de
                serviço. No Margem Compras, as notas fiscais de compra da sua empresa, para montar o
                painel de custos.
              </p>
            </section>
            <section>
              <h2 className="text-h3 text-text-primary">Certificado digital</h2>
              <p>
                Guardado criptografado em cofre, nunca em texto puro nem em log, usado só pela
                função que busca suas notas na Receita. Você revoga o acesso a qualquer momento.
              </p>
            </section>
            <section>
              <h2 className="text-h3 text-text-primary">Dados públicos de licitações</h2>
              <p>
                Vêm do PNCP, que é público por lei. Usamos só para mostrar histórico de preços. CPF
                de fornecedor pessoa física aparece mascarado.
              </p>
            </section>
            <section>
              <h2 className="text-h3 text-text-primary">Exclusão e retenção fiscal</h2>
              <p>
                Ao pedir exclusão, apagamos na hora seus dados de cadastro e de uso. Dados de nota
                fiscal ficam retidos pelo prazo legal de 5 anos, sem seu nome, CPF ou e-mail, por
                obrigação fiscal (Art. 16, I da LGPD e Art. 195 do CTN).
              </p>
            </section>
            <section>
              <h2 className="text-h3 text-text-primary">Onde ficam os dados</h2>
              <p>Em servidores no Brasil (São Paulo).</p>
            </section>
          </div>
        </Container>
      </main>
      <Rodape />
    </>
  );
}
