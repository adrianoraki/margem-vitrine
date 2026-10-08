# @margem/core

Código compartilhado por web, app (fase 2) e jobs. Não tem UI nem estado: só tipos, validação e
regras puras.

| Módulo            | Importação                       | O que tem                                                                                                                                                                            |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Raiz              | `@margem/core`                   | CNPJ (`validarCnpj`, `cnpjSchema`), moeda (`formatarMoeda`), margem (`calcularMargem`, RF-31), LGPD (`mascararDocumentoFornecedor`), schemas da NF-e (`notaSchema`), tipo `Database` |
| PNCP              | `@margem/core/pncp`              | Cliente da API pública com retry e paginação, schemas Zod de contratação, item e resultado, catálogo de alimentos, mapeamento para as linhas do banco                                |
| Supabase público  | `@margem/core/supabase`          | `criarClienteSupabasePublico` (recusa chave de serviço), `ehChaveDeServico`                                                                                                          |
| Supabase servidor | `@margem/core/supabase/servidor` | `criarClienteSupabaseServidor`, **só para jobs**. O `apps/web` não pode importar (ESLint).                                                                                           |

`src/database.types.ts` segue o formato do `supabase gen types`. Hoje ele é gerado das
migrations locais. Com o projeto criado, regenere com:

```bash
SUPABASE_PROJECT_ID=<ref> pnpm --filter @margem/core gen:types
```

## Rodar localmente

```bash
pnpm --filter @margem/core test        # Vitest
pnpm --filter @margem/core typecheck
pnpm --filter @margem/core lint
```

Os testes do cliente PNCP usam `fetch` injetado e fixtures no formato da API. Nenhum deles acessa a
rede.
