import { test } from '@playwright/test';

// Fluxo crítico (RF-14): salvar licitação e mover entre Interesse, Proposta enviada, Ganhou e Perdeu,
// com o movimento aparecendo em outra sessão via Realtime. Entra com o app logado (semanas 2–4).
test.fixme('funil: adicionar ao funil, desfazer em 5 s, mover de estágio e ver em outra aba', async () => {});
