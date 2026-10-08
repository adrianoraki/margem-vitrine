/**
 * Tokens do design system "painel financeiro calmo" (doc, seção Design System).
 * Fonte da verdade para web (via theme.css) e para o app Expo da fase 2 (importa este arquivo).
 * theme.css repete os valores porque CSS não importa TS; test/tokens.test.ts garante que batem.
 */
export const cores = {
  light: {
    bg: '#F7F8FA',
    surface: '#FFFFFF',
    'surface-raised': '#FFFFFF',
    border: '#E4E7EC',
    'text-primary': '#0B1220',
    'text-secondary': '#5B6474',
    primary: '#0B1220',
    accent: '#0E9F6E',
    'accent-soft': '#E7F7F0',
    warning: '#D97706',
    critical: '#DC2626',
    info: '#2563EB',
  },
  dark: {
    bg: '#0A0D12',
    surface: '#12161D',
    'surface-raised': '#1A1F28',
    border: '#242A35',
    'text-primary': '#F2F4F7',
    'text-secondary': '#98A2B3',
    primary: '#F2F4F7',
    accent: '#34D399',
    'accent-soft': '#0F2A21',
    warning: '#FBBF24',
    critical: '#F87171',
    info: '#60A5FA',
  },
} as const;

export type TokenCor = keyof typeof cores.light;

/** Escala tipográfica: [tamanho, altura de linha] em px, e peso. */
export const tipografia = {
  display: { web: [48, 56], mobile: [32, 40], peso: 700 },
  h1: { web: [32, 40], mobile: [24, 32], peso: 700 },
  h2: { web: [24, 32], mobile: [20, 28], peso: 600 },
  h3: { web: [18, 26], mobile: [17, 24], peso: 600 },
  body: { web: [16, 24], mobile: [16, 24], peso: 400 },
  small: { web: [14, 20], mobile: [14, 20], peso: 500 },
  caption: { web: [12, 16], mobile: [12, 16], peso: 500 },
  kpi: { web: [36, 40], mobile: [28, 32], peso: 700 },
} as const;

/** Famílias: Plus Jakarta Sans nos títulos, Inter no texto e nos números. */
export const fontes = {
  titulo: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', system-ui, sans-serif",
  texto: "'Inter Variable', 'Inter', system-ui, sans-serif",
} as const;

/** Escala de espaço (base 4), em px. */
export const espacos = [4, 8, 12, 16, 24, 32, 48, 64, 96] as const;

/** Raios em px. */
export const raios = { input: 8, chip: 8, botao: 12, card: 16, sheet: 24, pill: 999 } as const;

/** Durações em ms e curva padrão. Respeitar prefers-reduced-motion. */
export const movimento = {
  hover: 120,
  entrada: 200,
  pagina: 320,
  contagemKpi: 600,
  curva: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;
