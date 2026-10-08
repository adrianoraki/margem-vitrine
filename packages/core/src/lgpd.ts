/**
 * Mascara o documento de fornecedor pessoa física antes de gravar (docs/adr/0006-cpf-mascarado.md).
 * CNPJ passa inteiro: não é dado pessoal. CPF vira ***.456.789-** (o formato usado pelo próprio governo).
 * @param documento CPF/CNPJ como veio do PNCP (com ou sem máscara).
 * @param tipoPessoa 'PJ', 'PF' ou 'PE' (estrangeiro), como o PNCP informa.
 * @returns Documento pronto para gravar, ou null se vazio.
 */
export function mascararDocumentoFornecedor(
  documento: string | null | undefined,
  tipoPessoa: string | null | undefined,
): string | null {
  if (!documento) return null;
  const digitos = documento.replace(/\D/g, '');
  const pareceCpf = digitos.length === 11;
  if (tipoPessoa === 'PF' || pareceCpf) {
    if (digitos.length !== 11) return null;
    return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`;
  }
  return digitos || null;
}
