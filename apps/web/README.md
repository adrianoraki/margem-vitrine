# @margem/web

Site do Margem em Next.js 15 (App Router) + TypeScript strict + Tailwind v4 + TanStack Query.
Páginas:

| Rota                           | O que é                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `/`                            | Landing, estática com ISR de 5 min, com números e exemplos reais da coleta do PNCP |
| `/entrar`                      | Login sem senha: link mágico por e-mail ou Google (docs/adr/0013)                  |
| `/painel`                      | Área logada, protegida pelo middleware; o onboarding entra na próxima entrega      |
| `/auth/callback`, `/auth/sair` | Rotas de autenticação, com limite de taxa                                          |
| `/privacidade`                 | Resumo de privacidade e LGPD                                                       |

O favicon e os ícones do PWA saem de `src/app/icon.svg`; os PNG (`apple-icon.png`, `public/icones/`)
são gerados a partir dele.

## Rodar localmente

```bash
cp ../../.env.example .env.local   # preencha NEXT_PUBLIC_SUPABASE_* se quiser o contador ao vivo
pnpm dev                           # na raiz do monorepo → http://localhost:3000
```

Sem Supabase configurado, a landing abre normalmente e o contador ao vivo some. Ele não mostra zero
falso.

| Comando                              | O que faz                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `pnpm --filter @margem/web test`     | Vitest: limite de taxa e a regra "toda rota de API tem limite"              |
| `pnpm --filter @margem/web test:e2e` | Playwright (desktop e celular) contra `next start`; rode `pnpm build` antes |

Os três fluxos críticos (onboarding, funil de licitação e importação de NF-e) já têm arquivo em
`e2e/`, marcados `test.fixme` até as telas existirem. Quem implementar a tela transforma o arquivo
em teste no mesmo PR.

## Regras

- Toda rota em `src/app/api` é envolvida por `comLimiteDeTaxa`, e um teste garante isso.
- Só a chave **pública** do Supabase. O ESLint bloqueia o cliente de serviço e a leitura de
  `SUPABASE_SERVICE_ROLE_KEY`.
- Cabeçalhos de segurança (CSP, HSTS, X-Frame-Options etc.) ficam em `next.config.ts`.
- O deploy é feito pelo `deploy.yml`. A integração Git da Vercel fica desligada em `vercel.json`,
  para não haver deploy duplo.
