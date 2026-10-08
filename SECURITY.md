# Segurança

## Reportar uma vulnerabilidade

Escreva para **[e-mail de segurança a definir]** com o assunto `[SEGURANÇA] Margem`. Não abra issue pública.
A primeira resposta sai em até 2 dias úteis.

## Princípios aplicados desde o primeiro commit

- **Nenhum segredo no código ou no histórico.** Os valores ficam nas variáveis de ambiente da Vercel,
  nos Secrets do GitHub Actions e nos Secrets das Edge Functions. O `.env.example` só documenta.
- **RLS em toda tabela**, testada no CI (`supabase/tests/rls_test.sql`). Um teste falha se
  qualquer tabela de `core`, `licita` ou `compras` ficar sem RLS.
- **A service role só roda no servidor.** O cliente público recusa a chave de serviço, e o
  ESLint do `apps/web` proíbe importá-la.
- **Certificado A1 no Vault.** O upload vai direto para a Edge Function. Senha e arquivo nunca
  ficam em texto puro e nunca aparecem em log. Cada leitura fica auditada e o dono pode revogar a
  qualquer momento.
- **Limite de taxa** em toda rota de API pública. Um teste falha se alguma rota não usar.
- **Dependabot e CodeQL** ativos.

## Incidente com o cofre de certificados

Plano mínimo, detalhado em `docs/lgpd.md`:

1. Revogar todos os certificados (`compras.revogar_certificado`) e girar a service role.
2. Avisar os clientes afetados para revogarem o A1 na Autoridade Certificadora.
3. Comunicar a ANPD e os titulares em prazo razoável, conforme a LGPD.
