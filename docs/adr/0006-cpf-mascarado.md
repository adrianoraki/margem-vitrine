# 0006: CPF de fornecedor pessoa física gravado mascarado

**Contexto.** Alguns resultados do PNCP trazem o CPF de fornecedor pessoa física ou MEI. O dado é
público por transparência, mas republicá-lo inteiro não é necessário para a finalidade, que é
mostrar histórico de preço.

**Decisão.** O coletor grava o CPF como `***.456.789-**` (`mascararDocumentoFornecedor`). Uma
constraint em `licita.resultados` recusa 11 dígitos em claro para PF. O CNPJ é gravado inteiro.

**Consequências.** Não dá para cruzar o histórico de uma mesma pessoa física com precisão. Isso é
intencional: evita criar perfil sobre a pessoa.
