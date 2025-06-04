import js from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import configPrettier from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginSecurity from 'eslint-plugin-security';
import pluginSonarjs from 'eslint-plugin-sonarjs';
import pluginTestingLibrary from 'eslint-plugin-testing-library';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
  // Base configurations
  js.configs.recommended,
  // TypeScript configuration only for TypeScript files
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,mts,cts,tsx}'],
  })),
  // JavaScript and JSX files configuration
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      next: { rootDir: './' },
    },
    plugins: {
      '@next/next': pluginNext,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      import: pluginImport,
      'jsx-a11y': pluginJsxA11y,
      security: pluginSecurity,
      sonarjs: pluginSonarjs,
      unicorn: pluginUnicorn,
      'unused-imports': pluginUnusedImports,
    },
    rules: {
      // Add Next.js rules manually
      '@next/next/no-img-element': 'warn',
      '@next/next/no-head-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-typos': 'error',
      '@next/next/no-css-tags': 'error',
      '@next/next/no-title-in-document-head': 'error',
      '@next/next/google-font-display': 'warn',
      '@next/next/google-font-preconnect': 'warn',
      '@next/next/next-script-for-ga': 'warn',

      // React rules
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',

      // React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,

      // Import rules
      ...pluginImport.configs.recommended.rules,
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',

      // JSX A11y rules
      ...pluginJsxA11y.configs.recommended.rules,
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',

      // Security rules
      ...pluginSecurity.configs.recommended.rules,
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-require': 'off',

      // SonarJS rules
      ...pluginSonarjs.configs.recommended.rules,
      'sonarjs/cognitive-complexity': ['error', 25],
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],

      // Unicorn rules
      ...pluginUnicorn.configs.recommended.rules,
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/consistent-destructuring': 'off',
      'unicorn/no-useless-undefined': 'off',

      // Unused imports cleanup
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // General
      'no-console': 'off',
      'prefer-const': 'error',
    },
  },
  // TypeScript files configuration
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.eslint.json',
        tsconfigRootDir: '.',
      },
    },
    settings: {
      react: { version: 'detect' },
      next: { rootDir: './' },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    plugins: {
      '@next/next': pluginNext,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      import: pluginImport,
      'jsx-a11y': pluginJsxA11y,
      security: pluginSecurity,
      sonarjs: pluginSonarjs,
      unicorn: pluginUnicorn,
      'unused-imports': pluginUnusedImports,
    },
    rules: {
      // Add Next.js rules manually
      '@next/next/no-img-element': 'warn',
      '@next/next/no-head-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-typos': 'error',
      '@next/next/no-css-tags': 'error',
      '@next/next/no-title-in-document-head': 'error',
      '@next/next/google-font-display': 'warn',
      '@next/next/google-font-preconnect': 'warn',
      '@next/next/next-script-for-ga': 'warn',

      // React rules
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',

      // React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,

      // Import rules
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',

      // JSX A11y rules
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-autofocus': 'off',

      // Security rules
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-require': 'off',

      // SonarJS rules - disabled or relaxed
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/no-redundant-assignments': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/no-redundant-optional': 'off',
      'sonarjs/todo-tag': 'off',
      'sonarjs/function-return-type': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/no-invalid-await': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/link-with-target-blank': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/concise-regex': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/use-type-alias': 'off',
      'sonarjs/slow-regex': 'off',

      // Unicorn rules - disabled
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/prefer-code-point': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/no-object-as-default-parameter': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/consistent-destructuring': 'off',
      'unicorn/no-useless-undefined': 'off',

      // TypeScript overrides
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-misused-spread': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',

      // TypeScript strict typing rules to prevent any/unknown usage
      '@typescript-eslint/no-explicit-any': 'error',
      // Additional TypeScript strict rules
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Unused imports cleanup
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // General
      'no-console': 'off',
      'prefer-const': 'error',
    },
  },
  // File-specific overrides
  {
    files: [
      'app/**/page.{ts,tsx}',
      'app/**/layout.{ts,tsx}',
      'app/**/loading.{ts,tsx}',
      'app/**/error.{ts,tsx}',
      'app/**/not-found.{ts,tsx}',
      'app/**/route.{ts,tsx}',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  // Supabase client rules for server components and API routes
  {
    files: [
      'app/api/**/*.{ts,tsx}',
      'app/**/route.{ts,tsx}',
      'app/actions.ts',
      'app/**/server-actions.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/utils/supabase/client',
              message:
                'Server components and API routes should use the server-side Supabase client from @/utils/supabase/server instead.',
            },
          ],
        },
      ],
    },
  },
  // Supabase client rules for client components
  {
    files: ['app/**/page.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/utils/supabase/server',
              message:
                'Client components should use the client-side Supabase client from @/utils/supabase/client instead.',
            },
            {
              name: '@/utils/supabase/server-admin',
              message:
                'Client components should not use the server-admin Supabase client. Use the client-side client from @/utils/supabase/client instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    plugins: {
      'testing-library': pluginTestingLibrary,
    },
    rules: {
      ...pluginTestingLibrary.configs.react.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  {
    files: ['*.config.{ts,js,mjs,cjs}', '*.setup.{ts,js}'],
    rules: {
      'import/no-default-export': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['app/api/**/*.{ts,js}', 'middleware.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        NextRequest: 'readonly',
        NextResponse: 'readonly',
      },
    },
  },
  // Middleware-specific Supabase rules
  {
    files: ['middleware.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/utils/supabase/client',
              message:
                'Middleware should use the middleware-specific Supabase client from @/utils/supabase/middleware instead.',
            },
            {
              name: '@/utils/supabase/server',
              message:
                'Middleware should use the middleware-specific Supabase client from @/utils/supabase/middleware instead.',
            },
            {
              name: '@/utils/supabase/server-admin',
              message:
                'Middleware should use the middleware-specific Supabase client from @/utils/supabase/middleware instead.',
            },
          ],
        },
      ],
    },
  },
  // Add rules for ensuring proper Supabase client typing
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'import/no-named-default': 'error',
    },
  },
  // Rule to enforce proper SupabaseClient typing
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
    },
  },
  {
    files: ['eslint.config.mjs'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
  // Server-admin Supabase client restrictions
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      'app/api/twilio/**/*.{ts,tsx}',
      'app/api/subscriptions/**/*.{ts,tsx}',
      'app/api/webhook/**/*.{ts,tsx}',
      'app/api/payment/**/*.{ts,tsx}',
      'app/api/Concierge/**/*.{ts,tsx}',
      'utils/supabase/server-admin.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/utils/supabase/server-admin',
              message:
                'The server-admin Supabase client should only be used in specific API routes like twilio, subscriptions or webhooks.',
            },
          ],
        },
      ],
    },
  },
  // Prettier must be last to override other formatting rules
  configPrettier,
];
