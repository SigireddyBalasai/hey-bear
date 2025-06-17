/**
 * DEPRECATED: Use useClientAuth.ts for client components
 * This file is kept for backward compatibility but should not be used in new code
 *
 * For client components: import from '@/hooks/useClientAuth'
 * For server components: import from '@/hooks/useServerAuth'
 */

// Re-export from the appropriate client auth hook for backward compatibility
export { useAdminAuth, useAuth } from './useClientAuth';
