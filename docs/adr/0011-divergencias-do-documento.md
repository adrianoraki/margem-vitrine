# 0011: Onde o código diverge do documento do ecossistema

**Contexto.** O documento "Margem — Documentação do Ecossistema" é a fonte da verdade. O prompt de
kickoff trouxe correções mais recentes, e algumas escolhas de implementação ajustam detalhes.

**Decisão.** As divergências conscientes são:

| Documento                                                                        | Código                               | Por quê                                  |
| -------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------- |
| Jobs no Vercel Cron                                                              | GitHub Actions                       | 0003                                     |
| `packages/ui-tokens`                                                             | `packages/ui` (tokens + componentes) | Pedido do kickoff                        |
| Coletor sem lugar definido                                                       | `apps/coletor-pncp`                  | Job testável e isolado da web            |
| Importador DF-e como função Node na Vercel                                       | A decidir; tende a Actions           | O Vercel Cron não serve (0003)           |
| Certificado e-CNPJ ou e-CPF                                                      | Só e-CNPJ por ora                    | 0005                                     |
| Tabela `limites_taxa`, `log_jobs`, `solicitacoes_titular`, `acessos_certificado` | Acrescentadas                        | Rate limit, keep-alive, LGPD e auditoria |

**Consequências.** Quem ler o documento e o código encontra aqui o motivo de cada diferença.
