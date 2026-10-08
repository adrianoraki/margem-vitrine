# @margem/mobile — fase 2 (placeholder)

App nativo com **Expo (React Native) + Reanimated + Expo Router**, previsto no roadmap para depois
do MVP web (doc, "Stack tecnológica"). Nada é implementado aqui agora, de propósito: um site com
PWA instalável chega ao cliente pagante meses antes (docs/adr/0002-pwa-antes-do-app-nativo.md).

Quando começar:

- Criar o projeto com `pnpm create expo-app` dentro desta pasta, mantendo o nome `@margem/mobile`.
- Importar `@margem/core` (tipos do banco, cliente da API, validações Zod, formatação) e
  `@margem/ui/tokens` (cores, tipografia, espaços). Nenhuma regra de negócio mora no app.
- Push com Expo Notifications, registrando em `core.dispositivos_push` (plataforma `ios`/`android`).
- Tirar `@margem/mobile` do `ignore` em `.changeset/config.json`.

Este pacote não tem scripts, então `turbo` o ignora em lint, typecheck, test e build.
