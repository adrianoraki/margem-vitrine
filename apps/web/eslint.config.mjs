import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import raiz from '../../eslint.config.mjs';

export default [
  ...raiz,
  {
    plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // A service role do Supabase nunca entra no site (docs/adr/0004).
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@margem/core/supabase/servidor',
              message: 'Cliente com service role é só para jobs no servidor, nunca no apps/web.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='SUPABASE_SERVICE_ROLE_KEY']",
          message: 'apps/web nunca lê a service role key do Supabase.',
        },
      ],
    },
  },
];
