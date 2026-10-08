# LGPD do Margem

> Isto não é aconselhamento jurídico. É um ponto de partida técnico para revisar com um advogado
> antes do lançamento. Os dois produtos lidam com dado sensível por naturezas diferentes, e isso
> muda o que precisa de mais cuidado em cada um.

Estas regras valem desde o primeiro commit, não são ajuste de véspera de lançamento. Cada regra
abaixo traz o texto do documento do ecossistema e, em seguida, **como o código cumpre**.

## Margem Compras: o de maior risco

O certificado A1 costuma ser um e-CNPJ. Mas em muitas empresas pequenas quem assina é um e-CPF do
sócio, o que é dado pessoal em sentido pleno. Trate o certificado e a senha como a informação mais
sensível do sistema: cofre criptografado (Supabase Vault), nunca em texto puro, nunca em log,
acesso restrito a uma única função de servidor, e um jeito fácil de o cliente revogar o acesso a
qualquer momento.

**No código:**

- O upload vai do navegador direto para a Edge Function `certificado-upload`. Arquivo e senha vão
  para o Vault (`compras.salvar_certificado`). A tabela `compras.certificados` guarda só
  metadados e o id do segredo, e o papel `authenticated` nem tem GRANT nas colunas desse id.
- A leitura decifrada (`compras.ler_certificado`) só pode ser executada pela `service_role`, e
  cada leitura grava uma linha em `compras.acessos_certificado`.
- O dono revoga com `compras.revogar_certificado`, que apaga os segredos do Vault na hora.
- A Edge Function não escreve senha, arquivo nem mensagem do Postgres em log.
- Por ora, só e-CNPJ é aceito, porque a consulta DF-e é feita pelo CNPJ. O e-CPF fica
  reconhecido no código e é recusado com mensagem clara (docs/adr/0005).
- Testado em `supabase/tests/rls_test.sql`, seção 4.

## Margem Licita: dado majoritariamente público, mas não totalmente fora da LGPD

CNPJ de empresa vencedora não é dado pessoal. Mas fornecedores pessoa física ou MEI aparecem com
CPF em alguns registros do PNCP. Como esse dado já é público por lei de transparência,
republicá-lo tem base legal. O uso, porém, deve ficar dentro dessa finalidade (mostrar histórico
de preços), sem criar perfil sobre a pessoa. Vale ter um canal simples para pedido de correção ou
remoção.

**No código:**

- O coletor mascara o CPF antes de gravar (`***.456.789-**`, o formato do próprio governo). Uma
  constraint em `licita.resultados` recusa CPF de 11 dígitos em claro, como defesa em
  profundidade (docs/adr/0006).
- Nenhuma tela ou consulta agrega resultados por fornecedor pessoa física.
- Canal de correção e remoção: o e-mail de contato do rodapé (ver "Incidentes" abaixo). Pedido
  atendido = linha em `core.solicitacoes_titular`.

## Dado de quem usa o produto

Nome, e-mail e empresa de quem se cadastra seguem a LGPD normal: base legal de execução de
contrato, finalidade clara nos Termos de Uso, e os direitos do titular prontos desde o MVP. A RN-07
do documento já cobre exportar e excluir.

**No código:** a exclusão existe (`core.solicitar_exclusao`, com testes). A exportação em CSV
ainda não; ela entra com a tela "Conta → Exportar dados".

## Retenção: um conflito a resolver

A legislação fiscal brasileira exige guardar documentos fiscais por 5 anos, o que pode entrar em
tensão com um pedido de exclusão total feito pelo cliente. A prática comum é anonimizar o que
identifica a pessoa e manter o dado fiscal agregado pelo prazo legal, deixando isso explícito na
política de privacidade.

**No código:** a exclusão tem dois trilhos, descritos em
[politica-retencao-dados.md](politica-retencao-dados.md).

## Onde os dados ficam

O Supabase oferece região em São Paulo (sa-east-1). Escolher essa região reduz a discussão sobre
transferência internacional de dados.

**Na configuração:** o projeto Supabase é criado em **sa-east-1** (README, "Configurar o
Supabase"). As funções da Vercel também devem rodar na região `gru1` (São Paulo), a configurar no
projeto da Vercel.

## Política de Privacidade e Termos de Uso

Publique os dois em linguagem simples antes do primeiro cliente pagante, dizendo o que é coletado,
para quê, por quanto tempo, e como pedir acesso, correção ou exclusão.

**Estado:** existe um resumo em `/privacidade`, marcado como rascunho em revisão jurídica. Os
textos formais estão pendentes com o advogado.

## Incidentes

Tenha um canal de contato para incidentes (mesmo que seja só um e-mail seu) e um plano mínimo do
que fazer se o cofre de certificados for comprometido: a LGPD exige comunicar a ANPD e os titulares
em prazo razoável.

**Canal:** [e-mail de segurança a definir], assunto `[SEGURANÇA] Margem` (SECURITY.md).

**Plano mínimo se o cofre for comprometido:**

1. Revogar todos os certificados ativos (`compras.revogar_certificado`) e pausar o importador DF-e.
2. Girar a service role do Supabase e atualizar os Secrets do GitHub e das Edge Functions.
3. Ler `compras.acessos_certificado` para delimitar o que foi lido, por quem e quando.
4. Avisar cada cliente afetado para revogar o A1 junto à Autoridade Certificadora e emitir outro.
5. Comunicar a ANPD e os titulares em prazo razoável, com o que aconteceu, quais dados, o risco e
   as medidas tomadas.

## Pendente com o advogado antes do lançamento

- Política de Privacidade e Termos de Uso formais.
- Política formal de descarte e retenção, com a base legal documentada para uma eventual
  fiscalização da ANPD. O rascunho técnico está em
  [politica-retencao-dados.md](politica-retencao-dados.md).
- O texto-padrão de resposta a um pedido de exclusão total (rascunho no mesmo arquivo).
- A data exata do fim da retenção. Pelo Art. 195, parágrafo único, do CTN, a guarda vai até a
  prescrição dos créditos tributários, o que pode passar de 5 anos contados da emissão.
