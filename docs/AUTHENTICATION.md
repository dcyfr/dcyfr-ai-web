# Authentication Guide - JWT & Middleware

**Target Audience:** Full-stack developers, security engineers  
**Prerequisites:** Understanding of HTTP, cookies, JWT basics

---

## Overview

This template implements **JWT-based authentication** with:
- **httpOnly cookies** for web sessions (CSRF-safe)
- **Bearer tokens** for API clients
- **Middleware protection** for Server Components
- **bcrypt** password hashing

---

## Authentication Flow

### Registration

```
1. User submits email/password
2. Validate input with Zod
3. Check if email exists
4. Hash password with bcrypt (12 rounds)
5. Create user in database
6. Generate JWT token
7. Set httpOnly cookie
8. Return success response
```

### Login

```
1. User submits email/password
2. Validate input
3. Find user by email
4. Verify password with bcrypt.compare()
5. Generate JWT token
6. Set httpOnly cookie
7. Return user data (without password)
```

### Logout

```
1. Clear httpOnly cookie
2. Client redirects to login page
```

---

## JWT Implementation

### Generate Token

```typescript
// src/lib/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

// Usage
const token = generateToken({
  userId: user.id,
  email: user.email,
  role: user.role,
});
```

### Verify Token

```typescript
// src/lib/auth.ts
export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayload;
    
    return payload;
  } catch (error) {
    // Token expired, invalid signature, malformed
    return null;
  }
}

// Usage
const payload = verifyToken(token);
if (!payload) {
  return Response.json({ error: 'Invalid token' }, { status: 401 });
}
```

---

## API Routes

### Register Endpoint

```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, generateToken } from '@/lib/auth';
import { UserService } from '@/services/user.service';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  // 1. Parse and validate input
  const body = await request.json();
  const result = registerSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { email, name, password } = result.data;

  // 2. Check if user exists
  const existing = await UserService.findByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: 'Email already registered' },
      { status: 409 }
    );
  }

  // 3. Hash password
  const hashedPassword = await hashPassword(password);

  // 4. Create user
  const user = await UserService.create({
    email,
    name,
    password: hashedPassword,
  });

  // 5. Generate JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // 6. Set httpOnly cookie
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
```

### Login Endpoint

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword, generateToken } from '@/lib/auth';
import { UserService } from '@/services/user.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // 1. Validate input
  const body = await request.json();
  const result = loginSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  const { email, password } = result.data;

  // 2. Find user
  const user = await UserService.findByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // 3. Verify password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // 4. Generate JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // 5. Set cookie and return user
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
```

### Logout Endpoint

```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
```

---

## Middleware Protection

### Route Protection

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Verify token
  const payload = token ? verifyToken(token) : null;

  // Protected routes - require authentication
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!payload) {
      // Redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Auth routes - redirect if already authenticated
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (payload) {
      // Redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Role-Based Access

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const payload = token ? verifyToken(token) : null;

  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // User authentication required
  if (pathname.startsWith('/dashboard')) {
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}
```

---

## Password Hashing

### Hash Password (Registration)

```typescript
// src/lib/auth.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}
```

### Verify Password (Login)

```typescript
// src/lib/auth.ts
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

---

## Client-Side Authentication

### Login Form

```typescript
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      // Success - cookie is set automatically
      router.push('/dashboard');
      router.refresh(); // Refresh Server Components
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Login</h1>
      
      {error && <p className="text-red-500">{error}</p>}
      
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

### Logout Button

```typescript
// components/logout-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return <Button onClick={handleLogout}>Logout</Button>;
}
```

---

## Server Component Auth

### Get Current User

```typescript
// src/lib/server-auth.ts
import { cookies } from 'next/headers';
import { verifyToken, type JWTPayload } from './auth';

export function getCurrentUser(): JWTPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}
```

### Protected Server Component

```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server-auth';
import { LogoutButton } from '@/components/logout-button';

export default function DashboardPage() {
  const user = getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      <LogoutButton />
    </div>
  );
}
```

---

## API Authentication

### Protected API Route

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { PostService } from '@/services/post.service';

export async function POST(request: NextRequest) {
  // 1. Extract token from cookie or Authorization header
  const token =
    request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Verify token
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // 3. Process request with authenticated user
  const body = await request.json();
  const post = await PostService.create({
    ...body,
    authorId: payload.userId,
  });

  return NextResponse.json(post);
}
```

### Reusable Auth Helper

```typescript
// src/lib/api-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from './auth';

export function authenticate(request: NextRequest): JWTPayload | null {
  const token =
    request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function requireAuth(request: NextRequest): JWTPayload {
  const user = authenticate(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

// Usage in API route
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    
    // Process authenticated request
    const post = await PostService.create({ ...data, authorId: user.userId });
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

---

## Security Best Practices

### 1. httpOnly Cookies

```typescript
// ✅ Secure cookie configuration
response.cookies.set('token', token, {
  httpOnly: true,              // Prevents JavaScript access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',          // CSRF protection
  maxAge: 60 * 60 * 24 * 7,   // 7 days
  path: '/',
});

// ❌ Insecure
response.cookies.set('token', token); // Missing security flags
```

### 2. Strong JWT Secret

```env
# .env.local
JWT_SECRET=your-super-secret-key-min-32-chars-long-randomly-generated
```

Generate secure secret:
```bash
# Use OpenSSL
openssl rand -base64 32

# Or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Password Requirements

```typescript
// Zod schema with strong validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain special character');
```

### 4. Rate Limiting

```typescript
// middleware.ts with rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const identifier = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}
```

### 5. Token Refresh

```typescript
// Add refresh token functionality
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '30d',
  });
}

// app/api/auth/refresh/route.ts
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value;
  
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as JWTPayload;

    // Generate new access token
    const newToken = generateToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}
```

---

## Testing Authentication

### Unit Tests

```typescript
// __tests__/lib/auth.test.ts
import { generateToken, verifyToken, hashPassword, verifyPassword } from '@/lib/auth';

describe('Authentication', () => {
  describe('JWT', () => {
    it('should generate and verify valid token', () => {
      const payload = { userId: 1, email: 'test@example.com', role: 'user' as const };
      const token = generateToken(payload);
      const verified = verifyToken(token);
      
      expect(verified).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      const verified = verifyToken('invalid-token');
      expect(verified).toBeNull();
    });
  });

  describe('Password Hashing', () => {
    it('should hash and verify password', async () => {
      const password = 'password123';
      const hashed = await hashPassword(password);
      
      expect(hashed).not.toBe(password);
      
      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'password123';
      const hashed = await hashPassword(password);
      
      const isValid = await verifyPassword('wrongpassword', hashed);
      expect(isValid).toBe(false);
    });
  });
});
```

---

**Last Updated:** February 7, 2026  
**Version:** 1.0.0
