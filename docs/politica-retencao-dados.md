# Política de retenção de dados: exclusão de conta no Margem Compras

> Rascunho técnico para revisão jurídica. Não é aconselhamento jurídico.

## Por que a exclusão tem dois trilhos

O **Art. 16, inciso I, da LGPD** (Lei 13.709/2018) autoriza manter dado pessoal depois do fim do
tratamento para cumprir obrigação legal ou regulatória do controlador. O **Art. 195, parágrafo
único, do CTN** (Lei 5.172/1966) manda conservar os comprovantes fiscais até a prescrição dos
créditos tributários a que se referem. Na prática, isso significa guardar nota fiscal e XML por
pelo menos 5 anos. Apagar esses documentos a pedido do cliente feriria essa obrigação.

Por isso a exclusão de conta do Margem Compras tem dois trilhos:

```
Pedido de exclusão (dono da conta)
│
├── Trilho 1: cadastro e uso ──────────────► apagados NA HORA
│     perfil, membros, preferências, radar, funil, notificações,
│     dispositivos de push, vínculos, sincronização DF-e,
│     certificado A1 (segredos removidos do Vault)
│
└── Trilho 2: dados de nota fiscal ────────► RETENÇÃO LEGAL, isolados do uso diário
      ├── XML original: intacto no bucket `xml-retencao` (cold storage)
      └── tabelas de produção: nome, CPF e e-mail trocados por identificador anônimo;
          valores agregados (o que, quando, por quanto) permanecem
```

## Trilho 1: dados cadastrais e de uso, apagados de imediato

Quando o dono pede a exclusão, a função `core.solicitar_exclusao`, numa única transação:

| Dado                         | Tabela                                                  | Ação                                                                               |
| ---------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Certificado A1 e senha       | `vault.secrets`, `compras.certificados`                 | Segredos removidos do Vault; linha apagada                                         |
| Estado da importação DF-e    | `compras.sync_dfe`                                      | Apagado                                                                            |
| Vínculos produto ↔ licitação | `compras.vinculos_licitacao`                            | Apagados                                                                           |
| Radar, funil, matches        | `licita.regras_radar`, `licita.funil`, `licita.matches` | Apagados                                                                           |
| Notificações e push          | `core.notificacoes`, `core.dispositivos_push`           | Apagados                                                                           |
| Assinatura                   | `core.assinaturas`                                      | Status `cancelada`, id do gateway removido                                         |
| Acesso de todos os usuários  | `core.membros`                                          | Apagado (ninguém mais vê a organização)                                            |
| Identificação da organização | `core.organizacoes`                                     | CNPJ, nome fantasia e município apagados; razão social vira "Organização excluída" |

Depois, a conta de login (`auth.users`) é removida pela Admin API do Supabase. Essa etapa roda numa
Edge Function de exclusão, que ainda não existe e entra junto com a tela "Conta".

## Trilho 2: dados de nota fiscal, em retenção legal

### O XML original nunca é alterado

Qualquer edição no XML invalida a assinatura digital da SEFAZ, e aí ele deixa de valer como
comprovante. Por isso o XML:

- fica **intacto** no bucket privado `xml-retencao` do Supabase Storage (cold storage);
- não tem nenhuma política de acesso para `anon` ou `authenticated`: só o servidor lê;
- fica fora do alcance de relatórios, métricas e ações de marketing;
- é referenciado em `compras.notas.xml_storage_path`, e nunca é guardado no banco.

### As tabelas de produção são anonimizadas

Nas tabelas que alimentam o painel e as métricas:

| Dado                                                    | Onde                                    | Ação                                                                                                                      |
| ------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Nome, CPF/CNPJ e e-mail do destinatário                 | `compras.notas`                         | Trocados por nulo; a nota passa a ser identificada só pelo uuid anônimo da organização. `anonimizada_em` registra quando. |
| Fornecedor pessoa física (CPF)                          | `compras.fornecedores`                  | Documento apagado; nome vira "Fornecedor pessoa física"                                                                   |
| Chave de acesso, data, valores, itens, NCM, quantidades | `compras.notas`, `compras.itens_compra` | **Mantidos** pelo prazo legal                                                                                             |

O pedido fica registrado em `core.solicitacoes_titular`, com a data de conclusão e o número de
notas anonimizadas. Esse registro é a prova de que o pedido foi atendido.

### Fim da retenção

Quando o prazo legal termina, um job de descarte apaga o XML do bucket e as linhas de
`compras.notas` e `compras.itens_compra` da organização excluída. **Esse job ainda não existe.**
Antes de escrevê-lo, o advogado precisa fixar a regra exata da data (ver `docs/lgpd.md`).

### Implementação e testes

- `supabase/migrations/20260928000400_lgpd_retencao.sql`: `core.solicitar_exclusao` e o bucket
  `xml-retencao`.
- `supabase/tests/rls_test.sql`, seção 6: prova os dois trilhos. O cadastro some, a nota fica
  sem dado pessoal e com o valor intacto, o ex-dono perde o acesso, e um membro comum não
  consegue pedir a exclusão.

## Texto-padrão de resposta a quem pede exclusão total

> Pendente de revisão jurídica antes do uso.

**Assunto:** Seu pedido de exclusão de dados no Margem

Olá, [nome],

Recebemos seu pedido de exclusão de dados em [data do pedido] e ele foi atendido em
[data de conclusão].

**O que apagamos:** seus dados de cadastro e de uso. Isso inclui perfil, usuários da conta,
preferências, regras de alerta, funil de licitações, notificações, o certificado digital e a
senha dele. Nenhuma pessoa da sua empresa tem mais acesso à conta, e nós não usamos mais esses
dados para nada.

**O que precisamos guardar, e por quê:** os dados das notas fiscais de compra importadas para o
Margem Compras. A legislação fiscal obriga a conservar documentos fiscais até a prescrição dos
tributos a que se referem (Art. 195, parágrafo único, do Código Tributário Nacional), em geral
por pelo menos 5 anos. A Lei Geral de Proteção de Dados permite manter dados pessoais para
cumprir essa obrigação legal (Art. 16, inciso I, da LGPD).

**Como guardamos:**

- o arquivo XML original de cada nota fica sem nenhuma alteração, porque qualquer mudança
  invalida a assinatura digital da SEFAZ. Ele fica num armazenamento separado, que não é usado em
  relatórios nem em comunicação de marketing;
- nas bases que usamos no dia a dia, seu nome, CPF e e-mail foram trocados por um identificador
  anônimo. Ficam só os valores das compras (o que foi comprado, quando e por quanto);
- ao fim do prazo legal, esses dados também serão apagados.

Se tiver dúvida, ou quiser pedir acesso ou correção, responda este e-mail.

Atenciosamente,
[nome], Margem
[e-mail de contato]
