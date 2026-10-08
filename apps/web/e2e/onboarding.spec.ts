import { test } from '@playwright/test';

// Fluxo crítico (doc, "Jornada Margem Licita"): cadastro → CNPJ → radar → primeiro valor em < 3 min.
// Telas de CNPJ e radar existem (src/app/painel). Falta sessão de teste no e2e (o CI roda sem Supabase):
// quem ligar um Supabase local no job de e2e troca `fixme` por `test`.
test.fixme('onboarding: CNPJ preenche razão social, radar com um toque, feed abre com licitações', async () => {});
