# Architecture Decision Records

Uma decisão por arquivo, no formato curto: **Contexto, Decisão, Consequências**. Um ADR aceito
não é editado para mudar de ideia: escreva outro que o substitua e marque o antigo como
"Substituído por NNNN".

| #                                                            | Decisão                                                                    | Status |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- | ------ |
| [0001](0001-monorepo-turborepo-pnpm.md)                      | Monorepo com Turborepo e pnpm workspaces                                   | Aceito |
| [0002](0002-pwa-antes-do-app-nativo.md)                      | Site com PWA antes do app nativo                                           | Aceito |
| [0003](0003-coleta-no-github-actions.md)                     | Coleta do PNCP e keep-alive no GitHub Actions, não no Vercel Cron          | Aceito |
| [0004](0004-service-role-so-no-servidor.md)                  | Service role só em jobs de servidor; clientes usam a chave pública com RLS | Aceito |
| [0005](0005-certificado-a1-no-vault.md)                      | Certificado A1 via Edge Function direto para o Supabase Vault              | Aceito |
| [0006](0006-cpf-mascarado.md)                                | CPF de fornecedor pessoa física gravado mascarado                          | Aceito |
| [0007](0007-um-projeto-tres-esquemas-rls.md)                 | Um projeto Supabase, três esquemas, RLS testada em Postgres puro           | Aceito |
| [0008](0008-limite-de-taxa-no-postgres.md)                   | Limite de taxa contado no Postgres                                         | Aceito |
| [0009](0009-xml-fora-do-banco-e-exclusao-em-dois-trilhos.md) | XML fora do banco; exclusão em dois trilhos                                | Aceito |
| [0010](0010-tokens-em-tailwind-v4.md)                        | Tokens do design system em TS + CSS vars do Tailwind v4                    | Aceito |
| [0011](0011-divergencias-do-documento.md)                    | Onde o código diverge do documento do ecossistema                          | Aceito |
| [0012](0012-limites-do-plano-github.md)                      | Limites do plano GitHub para repositório privado                           | Aceito |
| [0013](0013-login-sem-senha.md)                              | Login sem senha com Supabase Auth e sessão em cookie                       | Aceito |
| [0014](0014-importacao-de-xml-pelo-site.md)                  | Importação de XML de NF-e pelo site, sem service role                      | Aceito |
