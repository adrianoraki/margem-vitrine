# 0008: Limite de taxa contado no Postgres

**Contexto.** Toda rota de API pública precisa de limite de taxa. Na Vercel, cada invocação
serverless pode cair numa instância diferente, então a contagem em memória não vale.

**Decisão.** `core.consumir_limite` (janela fixa, `security definer`, executável por `anon`)
conta por chave. A chave é o SHA-256 de sal + rota + IP, e o IP cru nunca é gravado.
`comLimiteDeTaxa` envolve todo route handler. Um teste varre `src/app/api` e falha se algum método
exportado não usar o wrapper. Se o Supabase estiver fora do ar ou não configurado, o fallback é em
memória.

**Consequências.** Cada requisição a uma rota de API custa uma chamada ao banco. Por isso a rota
do contador tem cache de 5 min na CDN. Se o volume crescer, dá para trocar por Upstash ou pelo
Firewall da Vercel sem mudar a assinatura do wrapper.
