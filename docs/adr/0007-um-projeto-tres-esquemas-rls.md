# 0007: Um projeto Supabase, três esquemas, RLS testada em Postgres puro

**Contexto.** O free permite 2 projetos. Os dois produtos precisam caber em um, com isolamento
claro entre dado público (PNCP) e dado privado por organização.

**Decisão.**

- Um projeto com os esquemas `core`, `licita` e `compras`. O `public` não é usado.
- Toda tabela nasce com RLS na mesma migration. O acesso por organização passa por
  `core.eh_membro` e `core.eh_dono` (`security definer`, `search_path` vazio). Os GRANTs são
  explícitos e por coluna onde há segredo.
- As tabelas do PNCP têm leitura pública e nenhuma política de escrita: só a `service_role` grava.
- `supabase/tests/rls_test.sql` roda num Postgres puro, com stubs mínimos do Supabase (papéis,
  `auth.uid()` e Vault). Falha se alguma tabela ficar sem RLS, se `anon` ganhar política de
  escrita, se uma organização enxergar outra, entre outros casos. Validado por mutação:
  desligar a RLS, criar uma política permissiva ou dar GRANT na coluna do cofre derrubam o teste.

**Consequências.** O CI testa a RLS sem Docker e sem projeto remoto. Os stubs precisam acompanhar o
Supabase, que é o risco de um dublê estreito. Se uma migration usar algo do Supabase que o stub
não tem, o CI falha com erro de objeto inexistente, e não em silêncio.
