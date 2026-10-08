# 0009: XML fora do banco; exclusão em dois trilhos

**Contexto.** O banco free tem 500 MB, e o documento já decidiu não guardar o XML bruto nele. A
LGPD pede exclusão sob demanda, e a lei fiscal pede guarda por pelo menos 5 anos
(docs/politica-retencao-dados.md).

**Decisão.** O XML original vai intacto para o bucket privado `xml-retencao` e fica referenciado em
`compras.notas.xml_storage_path`. O banco guarda só os itens extraídos. A exclusão
(`core.solicitar_exclusao`) apaga cadastro e uso na hora, e anonimiza o destinatário das notas,
mantendo os valores.

**Consequências.** O XML nunca é editado, porque a assinatura da SEFAZ precisa continuar válida.
O job de descarte ao fim do prazo ainda precisa ser escrito, depois da definição jurídica da data.
