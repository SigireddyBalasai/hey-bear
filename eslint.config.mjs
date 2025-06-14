import pluginNext from '@next/eslint-plugin-next';
import configPrettier from 'eslint-config-prettier';

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
    plugins: {
      '@next/next': pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
    },
  },
  configPrettier,
];
