import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginNext from '@next/eslint-plugin-next';
import pluginNode from 'eslint-plugin-n';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      next: {
        rootDir: './',
      },
    },
  },
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
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.eslint.json',
        tsconfigRootDir: '.',
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      '@next/next': pluginNext,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
      
      // Next.js specific rules - Comprehensive coverage
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-head-element': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-typos': 'error',
      '@next/next/no-async-client-component': 'warn',
      '@next/next/no-before-interactive-script-outside-document': 'error',
      '@next/next/no-css-tags': 'error',
      '@next/next/no-document-import-in-page': 'error',
      '@next/next/no-duplicate-head': 'error',
      '@next/next/no-head-import-in-document': 'error',
      '@next/next/no-page-custom-font': 'warn',
      '@next/next/no-script-component-in-head': 'error',
      '@next/next/no-styled-jsx-in-document': 'error',
      '@next/next/no-title-in-document-head': 'error',
      '@next/next/no-unwanted-polyfillio': 'error',
      '@next/next/inline-script-id': 'error',
      '@next/next/next-script-for-ga': 'warn',
      '@next/next/google-font-display': 'warn',
      '@next/next/google-font-preconnect': 'warn',
      '@next/next/no-assign-module-variable': 'error',
      
      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/prop-types': 'off', // Using TypeScript instead
      'react/no-unescaped-entities': 'off', // Disabled to allow apostrophes and quotes in content
      'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }], // Allow custom properties for cmdk
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn', // Changed to warning instead of error
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': false,
          'ts-check': false,
        }
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // General ESLint rules
      'no-console': 'off', // Disabled to allow console.log usage throughout the project
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
  // App Router specific configuration
  {
    files: [
      'app/**/page.{ts,tsx}',
      'app/**/layout.{ts,tsx}',
      'app/**/loading.{ts,tsx}',
      'app/**/error.{ts,tsx}',
      'app/**/not-found.{ts,tsx}',
      'app/**/global-error.{ts,tsx}',
      'app/**/template.{ts,tsx}',
      'app/**/default.{ts,tsx}',
    ],
    rules: {
      // App Router specific rules
      '@next/next/no-head-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      'import/no-default-export': 'off', // App Router requires default exports
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Props are often mutable
    },
  },
  // Client Components specific configuration
  {
    files: [
      'components/**/*.{ts,tsx}',
      'app/**/*client*.{ts,tsx}',
    ],
    rules: {
      // Client component rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/jsx-uses-vars': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/require-render-return': 'error',
    },
  },
  // Middleware specific configuration
  {
    files: ['middleware.{ts,js}'],
    rules: {
      // Middleware specific rules
      'n/no-unsupported-features/es-syntax': 'off',
      'import/no-default-export': 'off', // Middleware requires default export
    },
    languageOptions: {
      globals: {
        ...globals.node,
        NextRequest: 'readonly',
        NextResponse: 'readonly',
        URLPattern: 'readonly',
      },
    },
  },
  // Test files configuration
  {
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}',
    ],
    rules: {
      // Test specific rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },
  // Configuration files
  {
    files: [
      '*.config.{ts,js,mjs}',
      '*.setup.{ts,js}',
      'tailwind.config.{ts,js}',
      'postcss.config.{ts,js}',
    ],
    rules: {
      // Configuration file rules
      'import/no-default-export': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'n/no-unpublished-import': 'off',
    },
  },
  // Node.js specific configuration for API routes and server-side code
  {
    files: [
      'app/api/**/*.{ts,js}',
      'lib/**/*.{ts,js}',
      'utils/**/*.{ts,js}',
      'middleware.ts',
      '**/route.ts',
      '**/layout.ts'
    ],
    plugins: {
      n: pluginNode,
    },
    rules: {
      ...pluginNode.configs.recommended.rules,
      
      // Node.js specific rules adjusted for Next.js
      'n/no-unsupported-features/es-syntax': 'off', // Allow modern ES features with transpilation
      'n/no-unsupported-features/node-builtins': 'off', // Next.js polyfills many APIs
      'n/no-missing-import': 'off', // TypeScript handles this
      'n/no-missing-require': 'off', // We use ES modules
      'n/no-unpublished-import': 'off', // Allow dev dependencies in build tools
      'n/no-process-env': 'off', // Allow process.env usage in Next.js
      'n/prefer-global/process': 'error',
      'n/prefer-global/buffer': 'error',
      'n/prefer-global/console': 'error',
      'n/no-deprecated-api': 'warn',
      'n/callback-return': 'warn',
      'n/handle-callback-err': 'warn',
      'n/no-mixed-requires': 'error',
      'n/no-new-require': 'error',
      'n/no-path-concat': 'error',
      'n/no-process-exit': 'warn',
    },
    languageOptions: {
      globals: {
        ...globals.node,
        // Next.js specific globals for API routes
        NextRequest: 'readonly',
        NextResponse: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        fetch: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    settings: {
      node: {
        version: '>=18.0.0', // Next.js requires Node.js 18+
      },
    },
  },
];
