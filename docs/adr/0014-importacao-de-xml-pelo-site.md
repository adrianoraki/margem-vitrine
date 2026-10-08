# 0014: Importação de XML de NF-e pelo site, sem service role

**Contexto.** O passo 3 do onboarding (RF-21) pede que o cliente envie os XML das notas de compra
enquanto a busca automática na SEFAZ (DF-e, com o certificado A1) não existe. As tabelas de
`compras` não aceitam escrita do cliente (só leitura com RLS), e a service role não pode ir para o
site (ADR 0004).

**Decisão.**

- O XML é lido e validado no servidor Next (server action), com `lerNfe` do `@margem/core/dfe`
  (fast-xml-parser, entidades desligadas, valores como texto para não perder zeros do EAN) e o
  `notaSchema`. Um arquivo por chamada, até 2 MB.
- A gravação é da função `compras.importar_nota(organizacao, nota jsonb)`, `SECURITY DEFINER`, que
  confere `core.eh_membro` antes de qualquer escrita. Ela é idempotente pela chave de acesso, casa
  produto por EAN ou pelo nome e não guarda o e-mail do destinatário.
- O custo por produto sai de `compras.custos_produtos` (`SECURITY INVOKER`, RLS de quem chama):
  médio ponderado pela quantidade, mínimo, máximo e último, numa janela de dias.
- A margem da licitação usa o custo de 60 dias (RF-31). Produto sem compra recente cai no histórico.
  Item de licitação liga a produto por vínculo confirmado (`vinculos_licitacao`, com fator de
  conversão de unidade) ou, sem vínculo, por sugestão via termo do catálogo, marcada como
  "sugerido" na tela.
- O Margem Compras fica nos planos `compras_pro` e `completo`.

**Consequências.**

- XML enviado pelo site não é guardado no bucket `xml-retencao` (ADR 0009): o original fica com o
  cliente, e o banco guarda os campos extraídos. O bucket segue para as notas que o importador DF-e
  baixar da SEFAZ.
- Quem é membro pode gravar nota na própria organização chamando a função direto. Isso não dá acesso
  a nada de outra organização, e os testes em `supabase/tests/importacao_test.sql` cobrem isso.
- O envio do certificado continua indo do navegador direto para a Edge Function (ADR 0005). A função
  responde CORS só para `SITE_URL`, que precisa estar nas variáveis da função no Supabase.
