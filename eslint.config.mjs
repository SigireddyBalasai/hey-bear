import pluginNext from '@next/eslint-plugin-next';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import configPrettier from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginSecurity from 'eslint-plugin-security';
import pluginSonarjs from 'eslint-plugin-sonarjs';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginUnusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/coverage/**',
      '**/dist/**',
      '**/build/**',
      '**/*.d.ts',
      '**/tsconfig.tsbuildinfo',
      '**/public/**',
      '**/components/ui/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': pluginNext,
      '@typescript-eslint': tsEslint,
      'unused-imports': pluginUnusedImports,
      import: pluginImport,
      sonarjs: pluginSonarjs,
      security: pluginSecurity,
      unicorn: pluginUnicorn,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'jsx-a11y': pluginJsxA11y,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,

      // React settings
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js 13+
      'react/prop-types': 'off', // Using TypeScript instead

      // TypeScript rules (enhanced)
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Requires type information
      '@typescript-eslint/prefer-optional-chain': 'off', // Requires type information
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off', // Requires type information
      '@typescript-eslint/no-floating-promises': 'off', // Requires type information
      '@typescript-eslint/await-thenable': 'off', // Requires type information
      '@typescript-eslint/require-await': 'off', // Requires type information

      // Import/Export rules for unused code detection (enhanced)
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-unresolved': 'off', // Handled by TypeScript
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // React Hooks rules (enhanced)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React specific rules
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-script-url': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-children-prop': 'error',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': 'error',
      'react/jsx-fragments': ['error', 'syntax'],

      // Accessibility rules (enhanced)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/iframe-has-title': 'error',

      // Code quality rules (enhanced)
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/cognitive-complexity': ['warn', 12], // Reduced from 15
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/prefer-while': 'error',
      'sonarjs/no-nested-template-literals': 'warn',

      // Security rules (enhanced)
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-unsafe-regex': 'error',

      // Unicorn rules for modern JS/TS practices (enhanced)
      'unicorn/no-unnecessary-await': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-array-for-each': 'warn',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-ternary': 'warn',
      'unicorn/prefer-top-level-await': 'warn',
      'unicorn/prefer-type-error': 'error',
      'unicorn/throw-new-error': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-unnecessary-polyfills': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-number-properties': 'error',

      // General code quality (enhanced)
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-extra-boolean-cast': 'error',
      'no-unreachable': 'error',
      'no-unused-labels': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-implicit-coercion': 'error',
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-destructuring': 'warn',
      'no-param-reassign': 'warn',
      'no-return-assign': 'error',
      'no-useless-return': 'error',
      'consistent-return': 'warn',
      'no-else-return': 'warn',
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-lonely-if': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
      ],

      // Custom Supabase client usage rules will be handled by file-specific overrides
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // File-specific Supabase client usage rules
  {
    files: [
      '**/components/**/*.{ts,tsx}',
      '**/app/**/page.{ts,tsx}',
      '**/app/**/layout.{ts,tsx}',
      '**/hooks/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/utils/supabase/server', '@/utils/supabase/server-admin'],
              importNames: ['createClient'],
              message:
                'Client components cannot import from server-side Supabase clients. Use @/utils/supabase/client instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/middleware.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/utils/supabase/server',
                '@/utils/supabase/client',
                '@/utils/supabase/server-admin',
              ],
              importNames: ['createClient'],
              message:
                'Middleware can only use @/utils/supabase/middleware for Supabase operations.',
            },
          ],
        },
      ],
    },
  },
  configPrettier,
];
