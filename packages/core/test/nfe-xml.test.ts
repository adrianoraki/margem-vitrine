import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ErroNfe, lerNfe } from '../src/dfe';

const xml = readFileSync(new URL('./fixtures/nfe-exemplo.xml', import.meta.url), 'utf8');

describe('leitor de XML da NF-e (RF-21)', () => {
  it('extrai cabeçalho, emitente, destinatário e itens', () => {
    const n = lerNfe(xml);
    expect(n.chave).toBe('25260911222333000181550010000001231000001234');
    expect(n).toMatchObject({
      numero: '123',
      serie: '1',
      emitidaEm: '2026-09-20T10:32:11-03:00',
      emitente: { documento: '11222333000181', nome: 'CEREALISTA EXEMPLO LTDA', uf: 'PB' },
      destinatario: { documento: '06990590000123', nome: 'ATACADO EXEMPLO LTDA' },
      valorTotal: 349.8,
    });
    expect(n.itens).toEqual([
      {
        numeroItem: 1,
        descricao: 'ARROZ BRANCO TIPO 1 5KG',
        ean: '07891234567895',
        ncm: '10063021',
        cfop: '5102',
        quantidade: 10,
        unidade: 'FD',
        valorUnitario: 25.5,
        valorTotal: 255,
      },
      expect.objectContaining({ numeroItem: 2, ean: null, quantidade: 12, valorUnitario: 7.9 }),
    ]);
  });
  it('nunca extrai o e-mail do destinatário', () => {
    expect(JSON.stringify(lerNfe(xml))).not.toContain('@');
  });
  it('aceita a NF-e sem o envelope nfeProc (chave vem do Id)', () => {
    const semProc = xml.replace(/<\/?nfeProc[^>]*>/g, '').replace(/<protNFe[\s\S]*<\/protNFe>/, '');
    expect(lerNfe(semProc).chave).toBe('25260911222333000181550010000001231000001234');
  });
  it('recusa evento, arquivo que não é nota e XML quebrado com mensagem clara', () => {
    expect(() => lerNfe('<procEventoNFe><evento/></procEventoNFe>')).toThrow(/evento/);
    expect(() => lerNfe('<pedido><item/></pedido>')).toThrow(ErroNfe);
    expect(() => lerNfe(xml.replace('<vNF>349.80</vNF>', '<vNF>abc</vNF>'))).toThrow(/valorTotal/);
  });
  it('não expande entidades', () => {
    const comEntidade = xml.replace('ARROZ BRANCO', '&amp;xxe;ARROZ BRANCO');
    expect(lerNfe(comEntidade).itens[0]?.descricao).toContain('&amp;xxe;');
  });
});
