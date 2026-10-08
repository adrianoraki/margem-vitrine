# 0004: Service role só em jobs de servidor; clientes usam a chave pública com RLS

**Contexto.** A service role do Supabase ignora a RLS. Se vazar para o navegador ou o app, qualquer
usuário lê os dados de todos.

**Decisão.**

- Site e app usam só a chave pública. `criarClienteSupabasePublico` recusa uma chave de serviço,
  nos dois formatos (`sb_secret_…` e JWT com `role: service_role`), e o `env.ts` do site
  derruba o build se a chave pública for de serviço.
- O cliente com service role mora num módulo separado (`@margem/core/supabase/servidor`). O
  ESLint do `apps/web` proíbe importá-lo e proíbe ler `SUPABASE_SERVICE_ROLE_KEY`.
- A service role existe só em Secrets do GitHub Actions (coletor, keep-alive) e nos Secrets das
  Edge Functions. Nunca na Vercel.

**Consequências.** Ações privilegiadas do site (trocar plano, enviar certificado) passam por RPC
`security definer` ou por Edge Function, nunca por um backend Next com a service role.
