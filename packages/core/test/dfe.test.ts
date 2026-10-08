import { describe, expect, it } from 'vitest';
import { itemNotaSchema, notaSchema } from '../src/dfe/schemas';

const item = {
  numeroItem: 1,
  descricao: 'ARROZ TIPO 1 5KG',
  ean: '7891234567895',
  ncm: '10063021',
  cfop: '5102',
  quantidade: 10,
  unidade: 'FD',
  valorUnitario: 25.5,
  valorTotal: 255,
};

describe('schemas da NF-e (RF-21)', () => {
  it('"SEM GTIN" vira ean nulo', () => {
    expect(itemNotaSchema.parse({ ...item, ean: 'SEM GTIN' }).ean).toBeNull();
  });
  it('recusa chave de acesso fora de 44 dígitos e quantidade zero', () => {
    const nota = {
      chave: '2'.repeat(44),
      numero: '123',
      serie: '1',
      emitidaEm: '2026-09-01T10:00:00-03:00',
      emitente: { documento: '11.222.333/0001-81', nome: 'Atacadão', uf: 'PB' },
      valorTotal: 255,
      itens: [item],
    };
    expect(notaSchema.parse(nota).emitente.documento).toBe('11222333000181');
    expect(notaSchema.safeParse({ ...nota, chave: '123' }).success).toBe(false);
    expect(notaSchema.safeParse({ ...nota, itens: [{ ...item, quantidade: 0 }] }).success).toBe(
      false,
    );
  });
});
