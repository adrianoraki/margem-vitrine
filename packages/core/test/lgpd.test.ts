import { describe, expect, it } from 'vitest';
import { mascararDocumentoFornecedor } from '../src/lgpd';

describe('mascararDocumentoFornecedor', () => {
  it('mantém CNPJ inteiro (não é dado pessoal)', () => {
    expect(mascararDocumentoFornecedor('12.345.678/0001-95', 'PJ')).toBe('12345678000195');
  });
  it('mascara CPF de pessoa física', () => {
    expect(mascararDocumentoFornecedor('123.456.789-09', 'PF')).toBe('***.456.789-**');
  });
  it('mascara 11 dígitos mesmo sem tipoPessoa (defesa)', () => {
    expect(mascararDocumentoFornecedor('12345678909', null)).toBe('***.456.789-**');
  });
  it('PF com documento malformado não é gravado', () => {
    expect(mascararDocumentoFornecedor('1234', 'PF')).toBeNull();
    expect(mascararDocumentoFornecedor(null, 'PF')).toBeNull();
  });
});
