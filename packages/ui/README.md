# @margem/ui

Design system "painel financeiro calmo": fundo neutro, números grandes e legíveis, e uma única cor
de destaque. O verde (`accent`) fica reservado para dinheiro a favor do cliente.

- `src/tokens.ts`: fonte da verdade de cores (light e dark), tipografia, espaços, raios e movimento.
  Serve à web e ao app Expo.
- `src/theme.css`: os mesmos tokens para o Tailwind CSS v4 (`@theme`), com dark mode automático
  ou forçado por `data-theme="dark"`.
- Componentes no padrão shadcn/ui (cva + Radix Slot): `Botao` (`primario`, `conversao`,
  `secundario`, `texto`), `Card`, `Badge` e `Chip`.

## Usar no app Next

```css
/* globals.css */
@import 'tailwindcss';
@import '@margem/ui/theme.css';
@source '../../../../packages/ui/src';
```

```tsx
import { Botao } from '@margem/ui';
<Botao variante="conversao">Testar 14 dias</Botao>;
```

Utilitários do tema: `bg-surface`, `text-text-secondary`, `text-kpi`, `text-caption`,
`rounded-card`, `rounded-botao`, `shadow-md`, `ease-margem`, `font-titulo` e `.numeros`
(tabular-nums).

## Rodar localmente

```bash
pnpm --filter @margem/ui test   # confere theme.css × tokens.ts e contraste WCAG AA
```
