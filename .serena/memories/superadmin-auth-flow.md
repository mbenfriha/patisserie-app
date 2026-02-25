# Superadmin Authentication Flow - Complete Analysis

## Overview
The superadmin app is a separate Next.js 16 dashboard (port 3002) with a dedicated authentication flow that uses the same API backend as the main patisserie app. Superadmin accounts are stored in the `users` table with `role = 'superadmin'`.

## Architecture Components

### 1. Superadmin Frontend (apps/superadmin)
- **Framework**: Next.js 16 with App Router
- **Port**: 3002
- **API Client**: Custom `ApiClient` class that reads token from cookies
- **Authentication Method**: Cookie-based storage (`superadmin_token`)

### 2. API Backend (apps/api)
- **Framework**: AdonisJS 6 with Lucid ORM
- **Port**: 3333
- **User Model**: Single `users` table with role enum
- **Auth Provider**: Access tokens with 7-day expiry

### 3. Database Table: `users`
```
- id: UUID (primary key)
- email: string (unique, indexed)
- password: string (hashed with scrypt)
- full_name: string (nullable)
- role: enum ('patissier' | 'client' | 'superadmin')
- email_verified_at: timestamp (nullable)
- suspended_at: timestamp (nullable)
- suspend_reason: string (nullable)
- created_at: timestamp
- updated_at: timestamp
```

**Key Point**: Superadmin accounts are identified by `role = 'superadmin'` in this table. No separate admin table exists.

### 4. Token Storage Table: `auth_access_tokens`
```
- id: integer (primary key)
- tokenable_id: UUID (foreign key to users.id)
- type: string ('auth_token')
- name: string (nullable)
- hash: string (token hash)
- abilities: text
- created_at: timestamp
- updated_at: timestamp
- last_used_at: timestamp
- expires_at: timestamp (7 days)
```

---

## Complete Authentication Flow

### Step 1: Login Form Submission
**File**: `apps/superadmin/app/login/page.tsx`

```
User enters email + password → Form submitted
↓
fetch(`${NEXT_PUBLIC_API_URL}/auth/login`, {
  method: 'POST',
  body: { email, password }
})
```

- `NEXT_PUBLIC_API_URL` defaults to `http://localhost:3333` (or can be set to `https://api.patissio.com`)
- Endpoint: `POST /auth/login`

### Step 2: API Login Handler
**File**: `apps/api/app/controllers/auth/auth_controller.ts`

```typescript
async login({ request, response }: HttpContext) {
  const { email, password } = request.only(['email', 'password'])
  
  // Verify credentials using scrypt hash
  const user = await User.verifyCredentials(email, password)
  
  // Check if account is suspended
  if (user.suspendedAt) {
    return response.forbidden({
      message: 'Account suspended',
      reason: user.suspendReason,
    })
  }
  
  // Generate 7-day access token with 'oat_' prefix
  const token = await User.accessTokens.create(user)
  
  return response.ok({
    success: true,
    user: user.serialize(),
    token: token.value!.release(),
  })
}
```

**Returns**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@patissio.com",
    "fullName": "Admin Name",
    "role": "superadmin",
    "createdAt": "2025-02-25T...",
    "updatedAt": "2025-02-25T..."
  },
  "token": "oat_xxxxx..."
}
```

### Step 3: Client-Side Validation & Token Storage
**File**: `apps/superadmin/app/login/page.tsx` (lines 33-37)

```typescript
// Verify user has superadmin role
if (data.user.role !== 'superadmin') {
  throw new Error('Acces refuse - Super Admin requis')
}

// Store token in cookie (7 days, same site, path /)
document.cookie = `superadmin_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`

// Redirect to dashboard
router.push('/')
```

**Cookie Details**:
- Name: `superadmin_token`
- Value: Bearer token (format: `oat_xxxxx...`)
- Max-Age: 7 days (604800 seconds)
- SameSite: Lax
- Path: `/` (available site-wide)

### Step 4: Post-Login Redirect
**File**: `apps/superadmin/middleware.ts`

On page load, Next.js middleware checks for token:
```typescript
const token = request.cookies.get('superadmin_token')?.value

if (token && pathname === '/login') {
  // Redirect to dashboard
  return NextResponse.redirect(new URL('/', request.url))
}

if (!token && !isPublicPath) {
  // Redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}
```

- If token exists + on login page → redirect to `/` (dashboard)
- If token missing + on protected page → redirect to `/login`
- Only `/login` is public

### Step 5: Dashboard Load & Protected Routes
**File**: `apps/superadmin/app/(dashboard)/layout.tsx`

```typescript
useEffect(() => {
  const fetchMe = async () => {
    try {
      // Calls /auth/me with token in Authorization header
      const data = await api.get<{ user: User }>('/auth/me')
      setUser(data.user)
    } catch (err) {
      // If 401/403, clear token and redirect to login
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        document.cookie = 'superadmin_token=; path=/; max-age=0'
        router.push('/login')
      }
    }
  }
  fetchMe()
}, [router])
```

### Step 6: API Client Token Injection
**File**: `apps/superadmin/lib/api/client.ts`

All requests include the token:
```typescript
private getToken(): string | null {
  const match = document.cookie.match(/superadmin_token=([^;]+)/)
  return match ? match[1] : null
}

private getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  const token = this.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}
```

All `api.get()`, `api.post()`, etc. calls automatically include:
```
Authorization: Bearer oat_xxxxx...
```

### Step 7: API Authentication Middleware
**File**: `apps/api/app/middleware/auth_middleware.ts`

```typescript
async handle(ctx: HttpContext, next: NextFn, options = {}) {
  // Authenticates using 'api' guard (access tokens)
  await ctx.auth.authenticateUsing(options.guards || ['api'])
  return next()
}
```

**AdonisJS Auth Config** (`apps/api/config/auth.ts`):
- Guard: `tokensGuard` 
- Provider: `tokensUserProvider`
- Model: User
- Token field: `accessTokens`
- Verifies token hash matches stored `auth_access_tokens.hash`

### Step 8: Superadmin Routes Protection
**File**: `apps/api/start/routes.ts` (lines 139-155)

```typescript
router
  .group(() => {
    router.get('/stats/dashboard', '#controllers/superadmin/stats_controller.dashboard')
    router.get('/users', '#controllers/superadmin/users_controller.index')
    // ... more superadmin routes
  })
  .prefix('/superadmin')
  .use([
    throttle('api'),
    middleware.auth(),           // ← Requires valid token
    middleware.superadmin()      // ← Requires role === 'superadmin'
  ])
```

### Step 9: Superadmin Role Validation
**File**: `apps/api/app/middleware/superadmin_middleware.ts`

```typescript
async handle(ctx: HttpContext, next: NextFn) {
  const user = ctx.auth.user!
  if (user.role !== 'superadmin') {
    return ctx.response.forbidden({
      success: false,
      message: 'Access restricted to superadmins',
    })
  }
  return next()
}
```

---

## The 404 Error: GET to `https://api.patissio.com/`

The 404 error mentioned likely comes from:

1. **RewriteRule Issue**: In `apps/superadmin/next.config.ts`, there's a rewrite rule:
   ```typescript
   source: '/api/:path*'
   destination: `${apiUrl}/api/:path*'
   ```
   This assumes API endpoints have `/api/` prefix, but **they don't**. The actual endpoints are just `/auth/login`, `/superadmin/stats/dashboard`, etc.

2. **Browser may be fetching root API**: If any code tries to fetch from `/api/` without a path, it becomes `https://api.patissio.com/api/` which returns 404 because there's no root `/api` route on the API server.

**Fix**: The `ApiClient` doesn't use the rewrite rule; it fetches directly to the full URL (`https://api.patissio.com/auth/login`). The rewrite rule appears unused or misconfigured.

---

## Logout Flow
**File**: `apps/superadmin/app/(dashboard)/layout.tsx`

```typescript
const handleLogout = () => {
  // Clear token from cookies
  document.cookie = 'superadmin_token=; path=/; max-age=0'
  // Redirect to login
  router.push('/login')
}
```

Also called in error handling when token is invalid (401/403).

---

## Where Superadmin Accounts Live

**Table**: `users` (single unified table)
**Column**: `role` = `'superadmin'`
**No separate admin table**

Example query to find superadmins:
```sql
SELECT * FROM users WHERE role = 'superadmin'
```

Superadmin accounts can be:
- Created via API (same `/auth/register` endpoint, with `role: 'superadmin'`)
- Managed via superadmin routes: `/superadmin/users/*` (for CRUD operations)

---

## Key Security Features

1. **Scrypt hashing**: Passwords hashed with scrypt (via AdonisJS auth)
2. **Access tokens**: 7-day expiry, prefix `oat_`, stored in `auth_access_tokens` table
3. **Role-based access**: Two-layer check (middleware.auth() + middleware.superadmin())
4. **Account suspension**: Superadmin can suspend users; suspended accounts cannot login
5. **Cookie security**: `SameSite=Lax` prevents CSRF, cannot be accessed by JavaScript from other domains (HttpOnly not set, so accessible client-side)

---

## Summary Table

| Component | Details |
|-----------|---------|
| **Superadmin Storage** | `users` table, `role = 'superadmin'` |
| **Login Endpoint** | `POST /auth/login` (public) |
| **Token Type** | Access token, 7-day expiry, `oat_` prefix |
| **Token Storage** | Cookie: `superadmin_token` + `auth_access_tokens` table |
| **Protected Routes** | All `/superadmin/*` require `middleware.auth()` + `middleware.superadmin()` |
| **Current User Endpoint** | `GET /auth/me` (requires valid token) |
| **Logout** | Clear `superadmin_token` cookie + redirect to `/login` |
| **Redirect Guards** | Middleware redirects unauthenticated users to `/login` |
