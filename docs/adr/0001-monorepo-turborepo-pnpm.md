# 0001: Monorepo com Turborepo e pnpm workspaces

**Contexto.** Site, app nativo (fase 2) e jobs precisam dos mesmos tipos do banco, das mesmas
validações e dos mesmos tokens. Em repositórios separados, esse código diverge.

**Decisão.** Um monorepo com pnpm workspaces e Turborepo: `apps/web`, `apps/mobile`,
`apps/coletor-pncp`, `packages/core` e `packages/ui`. Os pacotes internos exportam TypeScript
direto do `src`, sem passo de build: o Next transpila (`transpilePackages`) e o `tsx` roda o
coletor.

**Consequências.** Uma mudança no `core` quebra na hora quem o usa (typecheck do monorepo no
pre-commit e no CI). O Turborepo faz cache das tarefas. Pacotes sem build não servem para publicar
no npm, e não precisam: são privados.
