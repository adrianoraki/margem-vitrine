import { expect, test } from '@playwright/test';

// Estes testes rodam com um Supabase falso (endereço inalcançável, ver ci.yml): validam a tela,
// a validação e a proteção de rota sem enviar e-mail de verdade.
test.describe('login', () => {
  test('recusa e-mail inválido sem sair da tela', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByLabel('E-mail de trabalho').fill('fulano@');
    await page.getByRole('button', { name: 'Receber link de acesso' }).click();
    await expect(page.locator('#email-erro')).toContainText('e-mail válido');
    await expect(page.getByLabel('E-mail de trabalho')).toHaveAttribute('aria-invalid', 'true');
  });

  test('link vencido mostra explicação', async ({ page }) => {
    await page.goto('/entrar?erro=link');
    await expect(page.locator('#email-erro')).toContainText('expirou');
  });

  test('área logada exige login e guarda o destino', async ({ page }) => {
    await page.goto('/painel');
    await expect(page).toHaveURL(/\/entrar\?next=%2Fpainel/);
  });

  test('confirmação sem token volta para o login com erro', async ({ page }) => {
    await page.goto('/auth/confirmar?type=email&next=//evil.com');
    await expect(page).toHaveURL(/\/entrar\?erro=link/);
  });

  test('callback sem código volta para o login com erro', async ({ page }) => {
    await page.goto('/auth/callback?next=//evil.com');
    await expect(page).toHaveURL(/\/entrar\?erro=link/);
  });
});
