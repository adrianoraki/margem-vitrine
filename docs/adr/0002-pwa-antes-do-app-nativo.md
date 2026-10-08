# 0002: Site com PWA antes do app nativo

**Contexto.** Desenvolvedor solo. Manter web e app nativo em paralelo desde o dia 1 atrasa o
primeiro cliente pagante em meses.

**Decisão.** Next.js com PWA instalável primeiro. `apps/mobile` fica como placeholder de Expo até a
fase 2.

**Consequências.** No iPhone, o push web só funciona com o PWA adicionado à tela inicial. Aceito
no MVP. Como toda regra de negócio fica no banco (RLS e RPC), o app da fase 2 reaproveita o
`core` sem reescrever regras.
