# Enhanced ESLint Rules for Type Safety

This document explains the comprehensive ESLint rules added to prevent unsafe type assumptions and object property access patterns in the Hey Bear codebase.

## Overview

The enhanced ESLint configuration includes:

- **TypeScript strict rules** to prevent `any` types and unsafe operations
- **Custom rules** specific to our codebase patterns
- **API route specific rules** for enhanced security
- **Supabase operation validation** rules

## Rule Categories

### 1. TypeScript Strict Safety Rules

#### `@typescript-eslint/no-explicit-any` ❌

Forbids the use of `any` type.

```typescript
// ❌ Bad
const data: any = response.json();

// ✅ Good
interface ResponseData {
  id: string;
  name: string;
}
const data: ResponseData = await response.json();
```

#### `@typescript-eslint/no-unsafe-*` Rules ❌

Prevents unsafe operations on `any` or unknown types:

- `no-unsafe-assignment`
- `no-unsafe-member-access`
- `no-unsafe-call`
- `no-unsafe-return`
- `no-unsafe-argument`

```typescript
// ❌ Bad
const result = unknownData.someProperty;
const value = unknownFunction();

// ✅ Good
if (isValidData(unknownData)) {
  const result = unknownData.someProperty;
}
```

#### `@typescript-eslint/consistent-type-assertions` ❌

Prevents object literal type assertions.

```typescript
// ❌ Bad
const user = { name: 'John' } as User;
const data = response as any;

// ✅ Good
const user: User = { name: 'John', id: '123' };
if (isUser(response)) {
  const data = response;
}
```

#### `@typescript-eslint/explicit-function-return-type` ⚠️

Requires explicit return types for functions.

```typescript
// ❌ Bad
function processData(input) {
  return input.map(item => item.value);
}

// ✅ Good
function processData(input: DataItem[]): string[] {
  return input.map(item => item.value);
}
```

#### `@typescript-eslint/strict-boolean-expressions` ❌

Prevents truthy/falsy assumptions.

```typescript
// ❌ Bad
if (data) {
  // data could be empty string, 0, etc.
}

// ✅ Good
if (data !== null && data !== undefined) {
  // Explicit null/undefined check
}
```

### 2. Custom Hey Bear Rules

#### `hey-bear/no-unsafe-object-access` ❌

Prevents unsafe property access without validation.

```typescript
// ❌ Bad
const name = body.user.name;
const id = session.metadata.userId;

// ✅ Good
if (isValidUserBody(body)) {
  const name = body.user.name;
}

if (isValidSession(session) && session.metadata) {
  const id = session.metadata.userId;
}
```

#### `hey-bear/require-type-guards` ⚠️

Requires validation before accessing external data.

```typescript
// ❌ Bad
const body = await request.json();
const userId = body.userId;

// ✅ Good
const rawBody = await request.json();
if (isValidRequestBody(rawBody)) {
  const userId = rawBody.userId;
}
```

#### `hey-bear/no-unsafe-json-access` ❌

Requires error handling for JSON operations.

```typescript
// ❌ Bad
const data = JSON.parse(jsonString);
const response = await fetch(url).then(r => r.json());

// ✅ Good
try {
  const data = JSON.parse(jsonString);
} catch (error) {
  // Handle parse error
}

try {
  const response = await fetch(url);
  const data = await response.json();
} catch (error) {
  // Handle fetch/parse error
}
```

#### `hey-bear/require-supabase-error-handling` ❌

Requires proper error checking for Supabase operations.

```typescript
// ❌ Bad
const { data } = await supabase.from('users').select('*');
const users = data.map(user => user.name);

// ✅ Good
const { data, error } = await supabase.from('users').select('*');
if (error) {
  console.error('Database error:', error);
  return;
}
if (data) {
  const users = data.map(user => user.name);
}
```

### 3. API Route Specific Rules

API routes have **stricter enforcement** of all rules, plus additional restrictions:

#### Forbidden Patterns in API Routes:

- Direct property access on `body`, `data`, `metadata`, `session`, `payload`
- Type assertions to `Record` or `any`
- JSON.parse without try-catch
- Optional chaining without validation

```typescript
// ❌ Bad in API routes
export async function POST(request: NextRequest) {
  const body = await request.json();
  const userId = body.userId; // Unsafe access
  const data = body as any; // Forbidden assertion
}

// ✅ Good in API routes
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();

    if (!isValidRequestBody(rawBody)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const userId = rawBody.userId; // Safe after validation
    // ... rest of implementation
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
```

## Type Guard Examples

Create proper type guards for validation:

```typescript
// Type guard for webhook payload
function isValidWebhookPayload(body: unknown): body is WebhookPayload {
  if (!body || typeof body !== 'object') return false;

  const payload = body as Record<string, unknown>;

  return (
    typeof payload.id === 'string' &&
    typeof payload.object === 'string' &&
    typeof payload.data === 'object' &&
    payload.data !== null
  );
}

// Type guard for Stripe session
function isCheckoutSession(obj: unknown): obj is Stripe.Checkout.Session {
  if (!obj || typeof obj !== 'object') return false;

  const session = obj as Record<string, unknown>;

  return (
    session.object === 'checkout.session' &&
    typeof session.id === 'string' &&
    typeof session.payment_status === 'string' &&
    typeof session.status === 'string'
  );
}

// Usage in API route
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();

    if (!isValidWebhookPayload(rawBody)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (!isCheckoutSession(rawBody.data.object)) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    // Now safely typed
    const session = rawBody.data.object;
    const sessionId = session.id; // TypeScript knows this is a string

    // ... rest of implementation
  } catch (error) {
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

## Running the Rules

Check for violations:

```bash
pnpm lint
```

Fix auto-fixable issues:

```bash
pnpm lint:fix
```

Build to ensure no type errors:

```bash
pnpm build
```

## Benefits

1. **Runtime Safety**: Prevents runtime errors from accessing undefined properties
2. **Type Safety**: Ensures all data is properly typed and validated
3. **Security**: Prevents injection attacks through unvalidated input
4. **Maintainability**: Makes code more readable and easier to debug
5. **Reliability**: Catches errors at development time rather than production

## Migration Strategy

1. **Start with warnings**: Some rules are set to `warn` initially
2. **Fix violations incrementally**: Address violations file by file
3. **Use type guards**: Replace type assertions with proper validation
4. **Add error handling**: Wrap JSON operations in try-catch
5. **Validate external data**: Always validate data from requests, APIs, databases

The rules will help maintain a robust, type-safe codebase that prevents the common pitfalls of assuming object structures and unsafe type operations.
