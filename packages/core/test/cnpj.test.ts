import { describe, expect, it } from 'vitest';
import { cnpjSchema, formatarCnpj, validarCnpj } from '../src/cnpj';

describe('CNPJ', () => {
  it('aceita CNPJ válido com e sem máscara', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCnpj('11222333000181')).toBe(true);
  });
  it('rejeita verificador errado, tamanho errado e repetição', () => {
    expect(validarCnpj('11222333000182')).toBe(false);
    expect(validarCnpj('1122233300018')).toBe(false);
    expect(validarCnpj('00000000000000')).toBe(false);
  });
  it('formata e o schema devolve só dígitos', () => {
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(cnpjSchema.parse('11.222.333/0001-81')).toBe('11222333000181');
    expect(cnpjSchema.safeParse('11.222.333/0001-80').success).toBe(false);
  });
});
