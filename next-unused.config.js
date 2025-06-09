module.exports = {
  // Entry points for your Next.js app
  entrypoints: [
    './app/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}', // In case you have pages directory
    './middleware.{ts,js}',
  ],
  
  // Include these directories/files in the analysis
  include: [
    './components/**/*',
    './lib/**/*',
    './utils/**/*',
    './hooks/**/*',
  ],
  
  // Exclude these from analysis
  exclude: [
    './node_modules/**/*',
    './.next/**/*',
    './public/**/*',
    './**/*.test.{ts,tsx}',
    './**/*.spec.{ts,tsx}',
    './**/__tests__/**/*',
    './**/stories/**/*',
    './**/*.stories.{ts,tsx}',
    './**/dist/**/*',
    './**/build/**/*',
    './**/coverage/**/*',
    './**/*.d.ts',
  ],
  
  // Enable debug mode for detailed output
  debug: true,
  
  // Additional options
  alias: {
    '@': './app',
    '@/components': './components',
    '@/lib': './lib',
    '@/utils': './utils',
    '@/hooks': './hooks',
  },
  
  // Ignore specific files that might be dynamically imported
  ignoreUnusedFiles: [
    // Add any files that are used but not detected (e.g., dynamic imports)
    './app/globals.css',
    './app/opengraph-image.png',
    './app/twitter-image.png',
    './components/ui/**/*', // UI components might be used dynamically
  ],
};
