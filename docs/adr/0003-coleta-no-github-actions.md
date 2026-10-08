# 0003: Coleta do PNCP e keep-alive no GitHub Actions, não no Vercel Cron

**Contexto.** O documento previa Vercel Cron. O plano Hobby da Vercel permite só 1 execução de cron
por dia, e a RF-11 pede coleta de hora em hora. O Supabase free pausa após 7 dias sem atividade.

**Decisão.** `coletor-pncp.yml` roda de hora em hora (`0 * * * *`) no GitHub Actions, com as
credenciais em Secrets. `keep-alive.yml` faz uma leitura em `core.log_jobs` a cada 3 dias, como
rede de segurança se o coletor parar. O coletor é um pacote próprio (`apps/coletor-pncp`),
testado com dublês completos do cliente PNCP.

**Consequências.**

- O cron do Actions é "melhor esforço": pode atrasar minutos em horário de pico. Aceitável para
  licitações.
- Em repositório **privado**, os minutos do Actions são limitados (ver 0012). O coletor instala só
  as próprias dependências para rodar em ~1–2 min.
- O importador DF-e (mTLS + SOAP, semanas 7–10) deve seguir o mesmo caminho, e não o Vercel Cron.
