# GitHub Copilot Instructions for Hey Bear

This document provides instructions for GitHub Copilot to assist developers working on the Hey Bear project. Hey Bear is a platform for creating AI assistants with document context, using Next.js, Supabase, Pinecone for vector storage, and Twilio for phone number assignment.

## Project Structure

- `/app` - Next.js app router structure
- `/components` - React components
- `/lib` - Core libraries and utilities
- `/utils` - Helper functions
- `/supabase` - Supabase configuration and migrations
- `/types` - TypeScript type definitions
- `/public` - Static assets

## Package Management

This project uses PNPM as the package manager. Always use PNPM commands rather than NPM or Yarn.

### Installation

```bash
pnpm install
```

### Adding Dependencies

```bash
pnpm add [package-name]       # Install as regular dependency
pnpm add -D [package-name]    # Install as dev dependency
```

### Running Scripts

```bash
pnpm dev     # Start development server
pnpm build   # Build the application
pnpm start   # Run the built application
pnpm lint    # Run linting
pnpm format  # Format code with Prettier
```

## Supabase Integration

### Local Development with Supabase

1. Install Supabase CLI:

```bash
pnpm install supabase@latest -g
```

2. Start Supabase locally:

```bash
supabase start
```

3. Generate TypeScript types from the Supabase schema:

```bash
pnpm db:types
```

4. Pull schema changes from remote Supabase:

```bash
pnpm db:pull:schemas
```

### Database Structure

The project uses multiple Supabase schemas:

- `public` - Primary application data
- `analytics` - Usage and analytics data
- `assistants` - AI assistant configurations
- `users` - User management and authentication

When working with database queries, use the generated types from `/lib/db.types.ts` for type safety.

## Environment Variables

The project requires several environment variables to be set in a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PINECONE_API_KEY=your_pinecone_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

## Best Practices

1. Follow the existing project structure
2. Use TypeScript properly with appropriate types
3. Leverage component reuse following the established patterns
4. Format code using the project's Prettier and ESLint configurations
5. Write proper commit messages following conventional commit standards
6. **NO DUMMY DATA**: Never use placeholder, dummy, or fake data in the codebase. All data should come from real sources (database, APIs, user input) or be clearly marked as example data for documentation purposes only

## Component Development

- Use the shadcn/ui component system that's already integrated
- Follow the existing component patterns for consistency
- Place shared components in the `/components` directory
- Place page-specific components within their respective page directories

## Database Operations

When working with Supabase:

1. Use the appropriate Supabase client (see Supabase Client Usage below) for database operations
2. Leverage the generated types for strongly-typed queries
3. Add any new migrations to `/supabase/migrations`

### Supabase Client Usage

The project enforces strict rules for Supabase client usage:

1. **Server-Side Components and API Routes**

   - Only use the server-side Supabase client: `import { createClient } from '@/utils/supabase/server'`
   - Applies to: API routes, Server Components, Server Actions

2. **Client-Side Components**

   - Only use the client-side Supabase client: `import { createClient } from '@/utils/supabase/client'`
   - Applies to: Client Components, pages with 'use client' directive

3. **Middleware**

   - Use the middleware-specific client: `import { updateSession } from '@/utils/supabase/middleware'`
   - Only for use in middleware.ts

4. **Admin Operations**

   - For specific admin operations: `import { createClient } from '@/utils/supabase/server-admin'`
   - Limited to specific API routes (twilio, subscriptions, webhooks)

5. **Type Enforcement**

   - Always use proper typing with SupabaseClient:

   ```typescript
   import type { SupabaseClient } from '@supabase/supabase-js';

   import type { Database } from '@/lib/db.types';

   // In functions:
   function example(supabase: SupabaseClient<Database>) {
     // ...
   }
   ```

## Authentication Flow

The application uses Supabase Auth for authentication with the following flow:

1. User signs up/in via the auth pages in `/app/(auth-pages)`
2. Authentication state is managed through the Supabase Auth hooks
3. Protected routes are handled via middleware checks

## API Structure

- API routes are defined under `/app/api/`
- Use Server Components and Actions for server-side operations
- Follow RESTful conventions for API endpoints

## Code Quality and ESLint Rules

The project uses ESLint to enforce code quality standards, including specific rules for Supabase client usage. Key ESLint rules include:

1. **Supabase Client Import Rules**:

   - Server components cannot import from `@/utils/supabase/client`
   - Client components cannot import from `@/utils/supabase/server` or `@/utils/supabase/server-admin`
   - Middleware can only use `@/utils/supabase/middleware`
   - Server-admin client has restricted usage

2. **TypeScript Best Practices**:
   - Use `import type` for type imports
   - Consistent type assertions with `as` syntax
   - No object literal type assertions
   - Proper typing with `SupabaseClient<Database>`

For more detailed information about these rules, refer to `SUPABASE_ESLINT_RULES.md` in the project root.

## Verification After Changes

After making any changes to the codebase, always verify that the changes don't introduce errors and follow project standards by running:

```bash
# Check for type errors, build issues, and ensure the project compiles
pnpm build

# Lint the code to ensure it follows project standards
pnpm lint

# If there are linting issues that can be automatically fixed, run
pnpm lint:fix

# Format the code to ensure consistent styling
pnpm format
```

Always ensure these commands run successfully before considering a change complete. If errors occur, fix them before proceeding with additional changes.

The ESLint rules will automatically check for proper Supabase client usage patterns, so pay close attention to any linting errors related to imports from the `@/utils/supabase/` directory.
