## O que muda

<!-- Uma ou duas frases: o comportamento antes e depois. -->

## Por quê

<!-- Requisito (RF/RN do doc), bug ou ADR relacionado. -->

## Como testei

- [ ] `pnpm lint && pnpm typecheck && pnpm test`
- [ ] `pnpm test:db` (se mexeu em `supabase/`)
- [ ] `pnpm test:e2e` (se mexeu em fluxo crítico)

## Checklist de segurança e LGPD

- [ ] Nenhum segredo, certificado, XML de cliente ou dado pessoal real no diff
- [ ] Tabela nova tem RLS ativada **e** caso em `supabase/tests/rls_test.sql`
- [ ] Rota nova em `apps/web/src/app/api` usa `comLimiteDeTaxa`
- [ ] Toda entrada externa passa por schema Zod
- [ ] Changeset criado (`pnpm changeset`) se mudou comportamento de pacote
- [ ] ADR novo se a decisão muda arquitetura, dado pessoal ou custo
