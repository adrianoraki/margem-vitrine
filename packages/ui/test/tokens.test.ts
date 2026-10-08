// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cores } from '../src/tokens';

// Hex comparado em minúsculas: o Prettier normaliza a caixa no CSS.
const css = readFileSync(new URL('../src/theme.css', import.meta.url), 'utf8').toLowerCase();

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

describe('tokens', () => {
  it('theme.css tem os mesmos valores de tokens.ts (light e dark)', () => {
    const blocoLight = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
    const blocoDark = css.slice(css.indexOf(":root[data-theme='dark']"));
    for (const [nome, valor] of Object.entries(cores.light)) {
      expect(blocoLight, `light ${nome}`).toContain(`--${nome}: ${valor.toLowerCase()};`);
    }
    for (const [nome, valor] of Object.entries(cores.dark)) {
      expect(blocoDark, `dark ${nome}`).toContain(`--${nome}: ${valor.toLowerCase()};`);
    }
  });

  it('texto principal e secundário passam WCAG AA sobre bg e surface', () => {
    for (const tema of [cores.light, cores.dark]) {
      expect(contraste(tema['text-primary'], tema.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(tema['text-secondary'], tema.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
