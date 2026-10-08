// Configuração compartilhada do ESLint (flat config). Cada pacote roda `eslint .`
// e o ESLint sobe diretórios até achar este arquivo; apps/web estende com as regras do Next.
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/next-env.d.ts',
      // Deno (Edge Functions) tem lint próprio: `deno lint` no CI.
      'supabase/functions/**',
    ],
  },
  js.configs.recommended,
  comments.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // `any` só com comentário justificando: eslint-disable-next-line + motivo.
      '@typescript-eslint/no-explicit-any': 'error',
      // ...e todo eslint-disable precisa dizer o porquê: `// eslint-disable-next-line regra -- motivo`.
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  {
    // Pacotes compartilhados: toda função, classe e constante exportada tem JSDoc.
    files: ['packages/*/src/**/*.{ts,tsx}'],
    ignores: ['**/database.types.ts', '**/index.ts'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
          },
          contexts: ['ExportNamedDeclaration > VariableDeclaration'],
        },
      ],
    },
  },
);
