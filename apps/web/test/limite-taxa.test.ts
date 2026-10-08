import { describe, expect, it } from 'vitest';
import {
  chaveDeLimite,
  comLimiteDeTaxa,
  consumirEmMemoria,
  ipDaRequisicao,
} from '@/lib/limite-taxa';

describe('limite de taxa', () => {
  it('janela fixa em memória: permite até o limite e reabre na janela seguinte', () => {
    const t0 = Date.UTC(2026, 8, 28, 12, 0, 0);
    expect(consumirEmMemoria('k1', 2, 60, t0)).toBe(true);
    expect(consumirEmMemoria('k1', 2, 60, t0 + 1000)).toBe(true);
    expect(consumirEmMemoria('k1', 2, 60, t0 + 2000)).toBe(false);
    expect(consumirEmMemoria('k1', 2, 60, t0 + 61_000)).toBe(true);
  });

  it('IP vira hash de 64 hex e nunca aparece na chave', () => {
    const chave = chaveDeLimite('contador', '200.10.20.30');
    expect(chave).toMatch(/^[0-9a-f]{64}$/);
    expect(chave).not.toContain('200.10');
  });

  it('usa o primeiro IP do x-forwarded-for', () => {
    const req = new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } });
    expect(ipDaRequisicao(req)).toBe('1.2.3.4');
  });

  it('responde 429 com Retry-After quando estoura', async () => {
    const rota = comLimiteDeTaxa(
      { rota: `teste-${Math.random()}`, limite: 1, janelaSegundos: 60 },
      () => new Response('ok'),
    );
    const req = () => new Request('http://x/api', { headers: { 'x-forwarded-for': '9.9.9.9' } });
    expect((await rota(req())).status).toBe(200);
    const bloqueada = await rota(req());
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.headers.get('retry-after')).toBe('60');
  });
});
