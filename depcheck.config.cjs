module.exports = {
  ignoreMatches: [
    // Build tools and development dependencies
    '@next/eslint-plugin-next',
    '@types/*',
    'eslint-*',
    'prettier-*',
    '@commitlint/*',
    'husky',
    'lint-staged',
    'cross-env',
    'tsx',

    // PostCSS and Tailwind
    'postcss',
    'postcss-html',
    'tailwindcss',
    'tailwindcss-animate',
    'tailwind-merge',

    // TypeScript
    'typescript',
    'typescript-eslint',

    // Testing
    'globals',
    '@testing-library/*',

    // Build and deployment
    'supabase',
    'sharp',

    // Utilities that might be used in build or rarely
    'glob',
    'uuid',
    'cspell',
  ],

  // Ignore directories
  ignoreDir: [
    'node_modules',
    '.next',
    'build',
    'dist',
    'coverage',
    'public',
    '.git',
    '.vscode',
    '.idea',
  ],

  // Skip missing dependencies check
  skipMissing: false,
};
