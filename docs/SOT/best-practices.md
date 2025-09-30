# Best Practices

## Overview

This document outlines coding standards, testing guidelines, security practices, and performance optimization strategies for Cognomega Edge.

## Coding Standards

### TypeScript

#### Type Safety

**Always use strict mode**:
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Prefer explicit types**:
```typescript
// ❌ Avoid
function process(data: any) {
  return data.value;
}

// ✅ Good
interface ProcessData {
  value: string;
  id: number;
}

function process(data: ProcessData): string {
  return data.value;
}
```

**Use type guards**:
```typescript
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

if (isError(result)) {
  console.error(result.message);
}
```

#### Interfaces vs Types

**Use interfaces for objects**:
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}
```

**Use types for unions and primitives**:
```typescript
// ✅ Good
type Status = 'pending' | 'active' | 'inactive';
type UserId = string;
```

#### Naming Conventions

```typescript
// Classes: PascalCase
class UserService {}

// Interfaces: PascalCase
interface UserData {}

// Types: PascalCase
type UserRole = 'admin' | 'user';

// Functions: camelCase
function getUserById() {}

// Variables: camelCase
const userId = '123';

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Private properties: prefix with _
class User {
  private _password: string;
}

// Generic types: Single capital letter or descriptive
function map<T, U>(items: T[], fn: (item: T) => U): U[] {}
```

### JavaScript/TypeScript Patterns

#### Async/Await

**Always use async/await over promises**:
```typescript
// ❌ Avoid
function fetchData() {
  return fetch(url)
    .then(res => res.json())
    .then(data => processData(data))
    .catch(err => handleError(err));
}

// ✅ Good
async function fetchData() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return processData(data);
  } catch (err) {
    handleError(err);
  }
}
```

#### Error Handling

**Create custom error classes**:
```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

throw new ValidationError('Invalid email', 'email');
```

**Handle errors at appropriate level**:
```typescript
// ✅ Good - Handle at service boundary
async function createUser(data: UserData) {
  try {
    const validated = await validateUserData(data);
    const user = await db.users.create(validated);
    return { success: true, user };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }
    // Log and rethrow unexpected errors
    console.error('[createUser]', error);
    throw error;
  }
}
```

#### Null Safety

**Use optional chaining and nullish coalescing**:
```typescript
// ✅ Good
const userName = user?.profile?.name ?? 'Anonymous';
const count = data?.items?.length ?? 0;
```

#### Immutability

**Prefer immutable operations**:
```typescript
// ❌ Avoid
function addItem(list: Item[], item: Item) {
  list.push(item);
  return list;
}

// ✅ Good
function addItem(list: Item[], item: Item): Item[] {
  return [...list, item];
}
```

### React/Frontend

#### Component Structure

```tsx
// ✅ Good structure
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export default function MyComponent({ title, onSubmit, isLoading = false }: Props) {
  // 1. Hooks
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  
  // 2. Derived state
  const isEmpty = value.trim().length === 0;
  
  // 3. Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ value });
  };
  
  // 4. Effects
  useEffect(() => {
    ref.current?.focus();
  }, []);
  
  // 5. Render
  return (
    <form onSubmit={handleSubmit}>
      <h2>{title}</h2>
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={isEmpty || isLoading}>
        Submit
      </button>
    </form>
  );
}
```

#### Hooks Best Practices

**Custom hooks for reusable logic**:
```typescript
// ✅ Good
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue] as const;
}

// Usage
const [theme, setTheme] = useLocalStorage('theme', 'dark');
```

**Memoization for expensive computations**:
```typescript
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.priority - b.priority);
}, [items]);

const handleClick = useCallback(() => {
  onItemClick(item.id);
}, [item.id, onItemClick]);
```

#### Performance

**Lazy load components**:
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

**Virtualize long lists**:
```typescript
import { VirtualList } from 'react-virtual';

<VirtualList
  itemCount={items.length}
  itemSize={50}
  renderItem={({ index }) => <Item data={items[index]} />}
/>
```

### API/Backend

#### Request Validation

**Always validate input**:
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().int().min(0).max(150)
});

app.post('/api/users', async (c) => {
  const body = await c.req.json();
  
  // Validate
  const result = UserSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error }, 400);
  }
  
  const user = await createUser(result.data);
  return c.json(user);
});
```

#### Response Format

**Consistent response structure**:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: number;
  };
}

// ✅ Good
return c.json({
  success: true,
  data: { user },
  metadata: {
    requestId: c.req.header('X-Request-Id'),
    timestamp: Date.now()
  }
});
```

#### Error Responses

**Use appropriate HTTP status codes**:
```typescript
// 400 - Bad Request (client error)
return c.json({ error: 'Invalid email format' }, 400);

// 401 - Unauthorized (not authenticated)
return c.json({ error: 'Authentication required' }, 401);

// 403 - Forbidden (authenticated but not authorized)
return c.json({ error: 'Insufficient permissions' }, 403);

// 404 - Not Found
return c.json({ error: 'User not found' }, 404);

// 409 - Conflict (duplicate, etc.)
return c.json({ error: 'Email already exists' }, 409);

// 422 - Unprocessable Entity (validation error)
return c.json({ error: 'Validation failed', fields: {...} }, 422);

// 500 - Internal Server Error
return c.json({ error: 'Internal server error' }, 500);
```

## Testing Guidelines

### Unit Tests

**Test individual functions**:
```typescript
// user.service.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail } from './user.service';

describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
  
  it('should return false for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
  
  it('should handle empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});
```

### Integration Tests

**Test API endpoints**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from './index';

describe('POST /api/users', () => {
  it('should create user with valid data', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User'
      })
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.user).toMatchObject({
      email: 'test@example.com',
      name: 'Test User'
    });
  });
  
  it('should reject invalid email', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid',
        name: 'Test User'
      })
    });
    
    expect(res.status).toBe(400);
  });
});
```

### E2E Tests

**Test user flows**:
```typescript
// tests/e2e/user-registration.spec.ts
import { test, expect } from '@playwright/test';

test('complete user registration flow', async ({ page }) => {
  // Navigate to registration
  await page.goto('/register');
  
  // Fill form
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.fill('[name="name"]', 'Test User');
  
  // Submit
  await page.click('[type="submit"]');
  
  // Verify success
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Welcome, Test User');
});
```

### Test Coverage

**Aim for high coverage**:
- **Critical paths**: 100%
- **Business logic**: 90%+
- **UI components**: 80%+
- **Utility functions**: 90%+

## Security Best Practices

### Authentication

**Use secure token storage**:
```typescript
// ❌ Avoid localStorage for sensitive tokens
localStorage.setItem('token', jwt);

// ✅ Good - HttpOnly cookies
// Set on server
c.cookie('token', jwt, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600
});
```

**Validate tokens properly**:
```typescript
import * as jose from 'jose';

async function validateJWT(token: string) {
  try {
    const publicKey = await jose.importSPKI(PUBLIC_KEY_PEM, 'RS256');
    const { payload } = await jose.jwtVerify(token, publicKey, {
      issuer: ISSUER,
      audience: AUDIENCE
    });
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error };
  }
}
```

### Input Sanitization

**Sanitize user input**:
```typescript
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 1000); // Limit length
}
```

**Use parameterized queries**:
```typescript
// ❌ Avoid string concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Good - Parameterized
const query = db.prepare('SELECT * FROM users WHERE email = ?');
const users = await query.all(email);
```

### CORS Configuration

**Strict CORS policy**:
```typescript
const ALLOWED_ORIGINS = [
  'https://app.cognomega.com',
  'https://www.cognomega.com'
];

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
  }
  
  await next();
});
```

### Rate Limiting

**Implement rate limiting**:
```typescript
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(identifier: string, limit: number, window: number): boolean {
  const now = Date.now();
  const timestamps = rateLimiter.get(identifier) || [];
  
  // Remove old timestamps
  const recent = timestamps.filter(t => now - t < window);
  
  if (recent.length >= limit) {
    return false;
  }
  
  recent.push(now);
  rateLimiter.set(identifier, recent);
  return true;
}
```

### Environment Variables

**Never hardcode secrets**:
```typescript
// ❌ Avoid
const apiKey = 'sk-abc123...';

// ✅ Good
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured');
}
```

## Performance Optimization

### Database Queries

**Use indexes**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
```

**Batch operations**:
```typescript
// ❌ Avoid N+1 queries
for (const userId of userIds) {
  const user = await db.users.findById(userId);
  users.push(user);
}

// ✅ Good - Single query
const users = await db.users.findMany({
  where: { id: { in: userIds } }
});
```

### Caching

**Cache expensive operations**:
```typescript
const cache = new Map<string, { value: any; expires: number }>();

function getCached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.value);
  }
  
  return fn().then(value => {
    cache.set(key, { value, expires: Date.now() + ttl });
    return value;
  });
}

// Usage
const config = await getCached('app-config', 60000, fetchConfig);
```

### Asset Optimization

**Optimize images**:
- Use WebP format
- Lazy load below fold
- Responsive images with srcset
- Use CDN

**Code splitting**:
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
```

### Bundle Size

**Analyze bundle**:
```powershell
pnpm build
npx vite-bundle-visualizer
```

**Tree shaking**:
```typescript
// ❌ Avoid default imports from large libraries
import _ from 'lodash';

// ✅ Good - Import specific functions
import { debounce } from 'lodash-es';
```

## Documentation Standards

### Code Comments

**Document why, not what**:
```typescript
// ❌ Avoid obvious comments
// Increment counter
counter++;

// ✅ Good - Explain reasoning
// Retry with exponential backoff to handle rate limits
await retry(fetchData, { backoff: 'exponential' });
```

**Use JSDoc for public APIs**:
```typescript
/**
 * Validates and creates a new user account.
 * 
 * @param data - User registration data
 * @returns Created user object with generated ID
 * @throws {ValidationError} If data is invalid
 * @throws {ConflictError} If email already exists
 */
async function createUser(data: UserRegistration): Promise<User> {
  // Implementation
}
```

### README Files

**Every package should have README.md**:
```markdown
# Package Name

Brief description

## Installation
\`\`\`
pnpm install
\`\`\`

## Usage
\`\`\`typescript
import { MyFunction } from './package';
\`\`\`

## API Reference
...

## Testing
...
```

## Git Workflow

### Commit Messages

**Use Conventional Commits**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(api): add user authentication

Implement JWT-based authentication with RS256 signing.
Added JWKS endpoint for public key distribution.

Closes #123

fix(frontend): correct responsive layout on mobile

The navigation menu was overflowing on screens < 640px.
Fixed by adjusting breakpoints and flex properties.

Fixes #456
```

### Branch Management

**Keep branches up to date**:
```powershell
git checkout main
git pull origin main
git checkout feature/my-feature
git rebase main
```

**Clean up merged branches**:
```powershell
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

## Code Review Guidelines

### As Reviewer

- **Be respectful** and constructive
- **Ask questions** rather than make demands
- **Explain reasoning** for suggestions
- **Approve minor issues** with comments
- **Test changes** locally when possible

### As Author

- **Keep PRs small** (< 500 lines ideally)
- **Self-review** before requesting
- **Respond to feedback** promptly
- **Explain decisions** in comments
- **Update docs** alongside code

---

*See also*:
- [Development Workflow](./development-workflow.md)
- [Contribution Guide](./contribution-guide.md)
- [CI/CD Pipeline](./ci-cd.md)
