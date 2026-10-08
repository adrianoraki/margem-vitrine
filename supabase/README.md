# supabase/

| Pasta         | O que tem                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `migrations/` | Schema dos três domínios (`core`, `licita`, `compras`) e a exclusão LGPD. Toda tabela nasce com RLS.                            |
| `tests/`      | `rls_test.sql` (isolamento, papéis, cofre, limite de taxa, exclusão) e os stubs mínimos do Supabase para rodar em Postgres puro |
| `functions/`  | Edge Functions em Deno: `certificado-upload` (RF-20)                                                                            |
| `config.toml` | Supabase CLI local; expõe `core`, `licita` e `compras` na API                                                                   |

## Rodar os testes de banco

```bash
pnpm test:db                                   # sobe um Postgres temporário (precisa de initdb/pg_ctl, e não roda como root)
PGHOST=localhost PGUSER=postgres PGPASSWORD=... pnpm test:db   # ou aponte para um Postgres existente
```

## Edge Functions

```bash
cd supabase/functions
deno lint && deno check certificado-upload/ && deno test --allow-env certificado-upload/
supabase functions deploy certificado-upload
```

## Regra de toda migration nova

1. `alter table ... enable row level security` na mesma migration do `create table`.
2. Políticas e GRANTs explícitos. Coluna com segredo nunca ganha GRANT para `authenticated`.
3. Um caso novo em `tests/rls_test.sql` provando o isolamento.
4. Regenerar `packages/core/src/database.types.ts`.
