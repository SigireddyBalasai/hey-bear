/**
 * Custom ESLint rules for Hey Bear project
 * Prevents unsafe type assumptions and object property access
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default {
  rules: {
    'no-unsafe-object-access': require('./no-unsafe-object-access.js'),
    'require-type-guards': require('./require-type-guards.js'),
    'no-unsafe-json-access': require('./no-unsafe-json-access.js'),
    'require-supabase-error-handling': require('./require-supabase-error-handling.js')
  }
};
