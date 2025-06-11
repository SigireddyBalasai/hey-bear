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
  // TypeScript files additional rules with proper plugin configuration
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      'unused-imports': pluginUnusedImports,
      import: pluginImport,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'off',

      // STRICT TYPE SAFETY RULES - Prevent unsafe type assumptions
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      
      // Prevent unsafe type assertions
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'never'
        }
      ],
      
      // Prevent non-null assertions without proper validation
      '@typescript-eslint/no-non-null-assertion': 'error',
      
      // Require explicit return types for functions
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true
        }
      ],
      
      // Strict boolean expressions - prevent truthy/falsy assumptions
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false
        }
      ],
      
      // Prevent using ts-ignore and other unsafe comments
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': true,
          'ts-check': false,
          minimumDescriptionLength: 10
        }
      ],
      
      // Require array type syntax consistency
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      
      // Prevent unsafe optional chaining
      '@typescript-eslint/no-unnecessary-condition': [
        'error',
        {
          allowConstantLoopConditions: false,
          allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false
        }
      ],

      // ADDITIONAL TYPE SAFETY PATTERNS
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSAsExpression > TSAnyKeyword",
          message: 'Type assertion to "any" is forbidden. Use proper type guards instead.'
        },
        {
          selector: "TSAsExpression > TSTypeReference[typeName.name='Record']",
          message: 'Type assertion to Record without validation is unsafe. Use type guards to validate structure first.'
        },
        {
          selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
          message: 'JSON.parse should be wrapped in try-catch or use a safe parsing function with validation.'
        },
        {
          selector: "MemberExpression[object.name=/^(body|data|metadata|session|payload|params|query|result)$/i][computed=true]",
          message: 'Unsafe bracket notation access on external data. Use proper type guards and validation first.'
        }
      ],

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
    rules: {
      // EXTRA STRICT RULES FOR API ROUTES - High security requirements
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      
      // Require explicit function return types in API routes
      '@typescript-eslint/explicit-function-return-type': 'error',
      
      // Prevent unsafe object access patterns common in API routes
      'dot-notation': ['error', { allowKeywords: true }],
      
      // Require proper error handling
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      
      // Prevent specific unsafe patterns in API routes
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
          message: 'JSON.parse should be wrapped in try-catch or use a safe parsing function with validation'
        },
        {
          selector: "TSAsExpression > TSTypeReference[typeName.name='Record']",
          message: 'Type assertion to Record without proper validation is forbidden. Use type guards instead.'
        },
        {
          selector: "TSAsExpression > TSAnyKeyword",
          message: 'Type assertion to "any" is forbidden in API routes'
        },
        {
          selector: "MemberExpression[object.name=/^(body|data|metadata|session|payload|params|query|result)$/i][computed=true]",
          message: 'Unsafe bracket notation access on external data. Use proper type guards and validation first.'
        },
        {
          selector: "MemberExpression[object.name=/^(body|data|metadata|session|payload)$/i][property.name!='error']",
          message: 'Direct property access on external data without validation. Use type guards first.'
        },
        {
          selector: "ChainExpression > MemberExpression[object.name=/^(body|data|metadata|session|payload)$/i]",
          message: 'Optional chaining on external data without prior type validation.'
        }
      ],
      
      // Require explicit null checks
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false
        }
      ]
    },
  },
  // Prettier must be last to override other formatting rules
  configPrettier,
];
