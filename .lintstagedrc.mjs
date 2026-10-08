// ESLint 9 resolve a configuração pelo diretório atual, não pelo arquivo. Rodar da raiz aplicaria
// só a config raiz aos arquivos do apps/web (sem as regras do Next e de segurança de lá).
// Por isso o lint vai pelo turbo, que roda cada pacote no próprio diretório (e usa cache).
export default {
  '*.{ts,tsx,js,mjs,cjs}': (arquivos) => ['pnpm lint', `prettier --check ${arquivos.join(' ')}`],
  '*.{json,md,yml,yaml,css}': 'prettier --check',
};
