import { z } from 'zod';

/**
 * Remove tudo que não é dígito.
 * @param valor CNPJ com ou sem máscara.
 * @returns Só os dígitos.
 */
export function limparCnpj(valor: string): string {
  return valor.replace(/\D/g, '');
}

function digitoVerificador(base: string): number {
  const pesos =
    base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma = base.split('').reduce((acc, d, i) => acc + Number(d) * (pesos[i] ?? 0), 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Valida os dígitos verificadores de um CNPJ numérico.
 * @param valor CNPJ com ou sem máscara.
 * @returns true se o CNPJ tem 14 dígitos, não é repetição de um dígito e os verificadores batem.
 */
export function validarCnpj(valor: string): boolean {
  const cnpj = limparCnpj(valor);
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const d1 = digitoVerificador(cnpj.slice(0, 12));
  const d2 = digitoVerificador(cnpj.slice(0, 12) + d1);
  return cnpj.endsWith(`${d1}${d2}`);
}

/**
 * Formata um CNPJ como 00.000.000/0000-00.
 * @param valor CNPJ com ou sem máscara.
 * @returns O CNPJ formatado, ou o valor original se não tiver 14 dígitos.
 */
export function formatarCnpj(valor: string): string {
  const c = limparCnpj(valor);
  if (c.length !== 14) return valor;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

/** Schema Zod de CNPJ: aceita com máscara, devolve só dígitos, rejeita verificador errado. */
export const cnpjSchema = z
  .string()
  .transform(limparCnpj)
  .refine(validarCnpj, { message: 'CNPJ inválido' });
