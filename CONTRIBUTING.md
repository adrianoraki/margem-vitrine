# Como contribuir

## Fluxo de branch

- `main` é protegida: só recebe código por pull request, com o CI verde e revisão aprovada. Push
  direto é bloqueado, inclusive para administradores.
- Crie a branch a partir da `main` atualizada, com um prefixo que diga o tipo:
  `feat/radar-ufs`, `fix/contador-fuso`, `chore/deps`, `docs/adr-0013`.
- Uma branch trata de um assunto. Se o PR precisa de "e também", provavelmente são dois PRs.
- Branches são apagadas depois do merge. O histórico da `main` é linear (squash ou rebase).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/pt-br/), validado pelo commitlint no
hook `commit-msg`:

```
feat(web): contador ao vivo na landing
fix(coletor): data do PNCP sem fuso tratada como horário de Brasília
chore(deps): atualiza next para 15.5.x
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
Para o escopo, use o pacote: `web`, `core`, `ui`, `coletor`, `db`, `functions`, `ci`, `docs`.

O hook `pre-commit` (Husky) roda o ESLint e o Prettier nos arquivos alterados e o typecheck do
monorepo. Não use `--no-verify`. Se o hook está errado, corrija o hook.

## Antes de abrir o PR

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:db     # se mexeu em supabase/
pnpm test:e2e    # se mexeu em fluxo crítico
pnpm changeset   # se mudou comportamento de algum pacote
```

## Revisão

- Todo PR precisa de pelo menos 1 aprovação, e o CODEOWNERS pede o dono.
- O revisor confere o checklist de segurança e LGPD do template do PR. Estes itens bloqueiam o merge:
  - tabela nova sem RLS;
  - tabela nova sem caso em `supabase/tests/rls_test.sql`;
  - rota de API sem `comLimiteDeTaxa`;
  - entrada externa sem schema Zod;
  - qualquer segredo ou dado real de cliente no diff.
- Decisão que muda arquitetura, dado pessoal ou custo ganha um ADR em `docs/adr/`, no formato
  curto: contexto, decisão e consequências.
- Comentários são resolvidos antes do merge.

## Regras de código

- TypeScript strict. Usar `any` exige
  `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- motivo`; sem o motivo, o lint falha.
- Toda função pública de `packages/*` tem JSDoc.
- Toda variável de ambiente nova entra em `.env.example`, explicada e sem valor real.
- A service role do Supabase só existe em jobs no servidor (`apps/coletor-pncp`, Edge Functions).
  O ESLint do `apps/web` bloqueia a importação.
