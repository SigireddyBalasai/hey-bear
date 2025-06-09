import js from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import configPrettier from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginTestingLibrary from 'eslint-plugin-testing-library';
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
      'unused-imports': pluginUnusedImports,
      import: pluginImport,
    },
    rules: {
      // Next.js rules
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
      '@next/next/no-duplicate-head': 'error',
      '@next/next/no-page-custom-font': 'warn',

      // React rules
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',

      // React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,

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

      // Import rules for Next.js unused detection
      'import/no-unused-modules': [
        'error',
        {
          unusedExports: true,
          ignoreExports: [
            'app/**/page.{ts,tsx}',
            'app/**/layout.{ts,tsx}',
            'app/**/loading.{ts,tsx}',
            'app/**/error.{ts,tsx}',
            'app/**/not-found.{ts,tsx}',
            'app/**/global-error.{ts,tsx}',
            'app/**/route.{ts,js}',
            'app/**/default.{ts,tsx}',
            'app/**/template.{ts,tsx}',
            'middleware.{ts,js}',
            'next.config.{js,ts}',
            'tailwind.config.{js,ts}',
            'postcss.config.{js,ts}',
          ],
        },
      ],
      'import/no-duplicates': 'error',

      // Check for undeclared variables (unimported)
      'no-undef': 'error',

      // General
      'no-console': 'off',
      'prefer-const': 'error',
    },
  },
  // TypeScript files additional rules
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    plugins: {
      'unused-imports': pluginUnusedImports,
      import: pluginImport,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'off',
      '@typescript-eslint/no-explicit-any': 'error',

      // Check for undeclared variables (unimported) - TypeScript already handles this but keeping for consistency
      'no-undef': 'off', // Disabled for TS files as TypeScript handles this better

      // Unused imports cleanup (override for TypeScript)
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
    },
  },
  // File-specific overrides
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    plugins: {
      'testing-library': pluginTestingLibrary,
    },
    rules: {
      ...pluginTestingLibrary.configs.react.rules,
      '@typescript-eslint/no-explicit-any': 'off',
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
  // Prettier must be last to override other formatting rules
  configPrettier,
];
