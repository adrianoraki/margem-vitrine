# 0010: Tokens do design system em TS + CSS vars do Tailwind v4

**Contexto.** Os mesmos tokens servem à web (Tailwind) e ao app Expo (sem CSS). O dark mode tem
que trocar as cores sem duplicar classes.

**Decisão.** `packages/ui/src/tokens.ts` é a fonte da verdade. `theme.css` define as cores como
variáveis CSS (light, dark pelo sistema e dark forçado por `data-theme`) e as expõe ao Tailwind v4
via `@theme`. A tipografia é mobile-first, com a escala web a partir de 768 px. Um teste confere
que `theme.css` e `tokens.ts` batem, e que o texto passa WCAG AA nos dois temas. As fontes vêm
do npm (`@fontsource-variable`), e não do Google Fonts: nenhuma requisição a terceiros ao abrir o
site.

**Consequências.** Ao mudar uma cor, é preciso mudar os dois arquivos, e o teste avisa se esquecer.
Os componentes seguem o padrão shadcn/ui (cva + Radix Slot), com os nomes do design system
(`Botao`, `Card`, `Badge`, `Chip`).
