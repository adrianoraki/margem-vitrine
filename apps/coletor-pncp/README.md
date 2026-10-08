# @margem/coletor-pncp

Job de coleta do PNCP (RF-11). Roda de hora em hora pelo `.github/workflows/coletor-pncp.yml`.

A cada execução:

1. Busca as contratações publicadas nos últimos `COLETOR_DIAS` dias, por UF e modalidade
   (padrão: PB, pregão eletrônico e dispensa).
2. Fica com as de alimentos: o objeto precisa casar com o catálogo de `@margem/core/pncp`.
3. Busca os itens e, para os itens com resultado, os vencedores com o preço homologado. O CPF de
   pessoa física é mascarado antes de gravar.
4. Faz upsert idempotente em `licita.contratacoes`, `licita.itens` e `licita.resultados`.
5. Revisita até `COLETOR_REVISITAR` contratações já encerradas e sem homologação, porque o preço
   vencedor só aparece semanas depois da publicação.
6. Registra início, fim e resumo em `core.log_jobs`.

Um erro numa contratação vai para o resumo e não derruba as outras.

## Rodar localmente

```bash
# Sem gravar nada (não precisa de Supabase):
COLETOR_SECO=1 pnpm coletar:pncp

# Gravando (use um projeto de teste, nunca produção na sua máquina):
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm coletar:pncp

# Primeira carga maior:
COLETOR_DIAS=30 pnpm coletar:pncp

pnpm --filter @margem/coletor-pncp test
```

Variáveis em `.env.example`. A service role só existe aqui e nos Secrets do GitHub Actions.
