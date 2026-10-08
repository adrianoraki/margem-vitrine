import { expect, test } from '@playwright/test';

test.describe('landing', () => {
  test('mostra as seções Margem Licita e Margem Compras', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Radar de licitações de alimentos/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /qual fornecedor aumentou seu preço/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Pague quando o Margem se pagar/ }),
    ).toBeVisible();
  });

  test('CTA principal leva ao login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Criar conta grátis' }).first().click();
    await expect(page).toHaveURL(/\/entrar/);
    await expect(page.getByRole('heading', { name: 'Entre no Margem' })).toBeVisible();
  });

  test('tem favicon e manifesto próprios', async ({ page, request }) => {
    await page.goto('/');
    const icone = await page.locator('link[rel="icon"]').first().getAttribute('href');
    expect(icone).toMatch(/icon/);
    expect((await request.get(icone ?? '')).status()).toBe(200);
    const manifesto = await request.get('/manifest.webmanifest');
    expect(manifesto.status()).toBe(200);
    expect((await manifesto.json()).name).toBe('Margem');
  });

  test('envia cabeçalhos de segurança', async ({ request }) => {
    const r = await request.get('/');
    expect(r.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(r.headers()['x-frame-options']).toBe('DENY');
    expect(r.headers()['x-powered-by']).toBeUndefined();
  });

  test('rota pública de API tem limite de taxa', async ({ request }) => {
    const ip = `203.0.113.${Math.floor(Math.random() * 250)}`;
    let ultimo = 200;
    for (let i = 0; i < 35 && ultimo !== 429; i++) {
      ultimo = (
        await request.get('/api/contador', { headers: { 'x-forwarded-for': ip } })
      ).status();
    }
    expect(ultimo).toBe(429);
  });
});
