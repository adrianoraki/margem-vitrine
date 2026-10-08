import { describe, expect, it } from 'vitest';
import { normalizarTexto, termosCasados } from '../src/pncp/catalogo';

describe('catálogo de alimentos', () => {
  it('normaliza acento e caixa', () => {
    expect(normalizarTexto('GÊNEROS  Alimentícios!')).toBe('generos alimenticios');
  });
  it('casa termos como palavra inteira, com plural regular', () => {
    expect(termosCasados('Aquisição de GÊNEROS ALIMENTÍCIOS para merenda')).toEqual([
      'generos alimenticios',
      'merenda',
    ]);
    expect(termosCasados('Carnes bovinas e frangos congelados')).toEqual(['carne', 'frango']);
    expect(termosCasados('Feijão carioca tipo 1')).toEqual(['feijao']);
  });
  it('não casa pedaço de palavra', () => {
    expect(termosCasados('Serviço de paocamento asfáltico')).toEqual([]);
    expect(termosCasados('Aquisição de pneus e câmaras')).toEqual([]);
    expect(termosCasados('Material de limpeza e higiene')).toEqual([]);
  });
});
