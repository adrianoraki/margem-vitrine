# 0005: Certificado A1 via Edge Function direto para o Supabase Vault

**Contexto.** O A1 e a senha dão acesso às notas fiscais da empresa. É o dado mais sensível do
sistema (docs/lgpd.md).

**Decisão.**

- O navegador envia `.pfx` + senha por multipart direto para a Edge Function
  `certificado-upload`. O Next não recebe o arquivo, e ele nunca volta ao cliente.
- A função confere quem é o usuário, se ele é dono (RF-03) e o limite de taxa (5 tentativas a cada 10 min).
  Depois abre o PKCS#12 com a senha e valida a data e a raiz do CNPJ. Por último, grava no Vault via
  `compras.salvar_certificado`, que só a `service_role` pode executar.
- A tabela guarda metadados e o id do segredo. O papel `authenticated` não tem GRANT nas colunas do
  id. Cada leitura decifrada é auditada, e a revogação apaga o segredo.
- Aceita só e-CNPJ, porque a Distribuição DF-e consulta pelo CNPJ. O e-CPF é reconhecido e
  recusado com mensagem clara.

**Consequências.** Enviar certificado exige o Supabase Pro antes do primeiro A1 real (o free não tem
backup). Um cliente que só tem e-CPF usa o upload manual de XML até a decisão ser revista. Os
testes geram um `.pfx` descartável em memória: nenhum certificado vai para o repositório.
