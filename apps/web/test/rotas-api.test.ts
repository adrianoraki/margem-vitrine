import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Regra de segurança: toda rota de API pública tem limite de taxa.
// Este teste varre TODO src/app (api/, auth/...) e falha se algum route.ts exportar handler sem comLimiteDeTaxa.

function rotas(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return rotas(p);
    return /^route\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

describe('rotas de API', () => {
  const arquivos = rotas(join(__dirname, '../src/app'));

  it('encontra as rotas conhecidas (o teste não passa no vazio)', () => {
    const nomes = arquivos.map((a) => a.replace(/\\/g, '/'));
    for (const r of [
      'api/contador/route.ts',
      'auth/callback/route.ts',
      'auth/confirmar/route.ts',
      'auth/sair/route.ts',
    ]) {
      expect(
        nomes.some((n) => n.endsWith(r)),
        r,
      ).toBe(true);
    }
  });

  it.each(arquivos)('%s: todo método exportado passa por comLimiteDeTaxa', (arquivo) => {
    const fonte = readFileSync(arquivo, 'utf8');
    const metodos = [
      ...fonte.matchAll(
        /export\s+(?:const|async function|function)\s+(GET|POST|PUT|PATCH|DELETE)\b(.*)/g,
      ),
    ];
    expect(metodos.length).toBeGreaterThan(0);
    for (const [, metodo, resto] of metodos) {
      expect(resto, `${metodo} sem comLimiteDeTaxa`).toMatch(/=\s*comLimiteDeTaxa\(/);
    }
  });
});
