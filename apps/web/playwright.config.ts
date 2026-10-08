import { defineConfig, devices } from '@playwright/test';

const porta = Number(process.env.PORTA_E2E ?? 3100);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${porta}`,
    trace: 'retain-on-failure',
    // Só para máquinas com Chromium pré-instalado de outra versão; no CI fica vazio.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm start --port ${porta}`,
    port: porta,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
