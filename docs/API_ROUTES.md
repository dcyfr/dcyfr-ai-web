# API Routes Guide - Next.js 14 App Router

**Target Audience:** Backend developers, API designers  
**Prerequisites:** Understanding of REST APIs, HTTP methods, TypeScript

---

## Overview

Next.js 14 App Router uses **Route Handlers** for API endpoints. Route handlers are defined in `route.ts` files within the `app/` directory and support all HTTP methods.

---

## Route Handler Basics

### File Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts       # POST /api/auth/login
│   │   └── register/
│   │       └── route.ts       # POST /api/auth/register
│   ├── posts/
│   │   ├── route.ts           # GET /api/posts, POST /api/posts
│   │   └── [id]/
│   │       └── route.ts       # GET /api/posts/:id, PATCH /api/posts/:id, DELETE /api/posts/:id
│   └── health/
│       └── route.ts           # GET /api/health
```

### HTTP Methods

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/posts
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'List posts' });
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ message: 'Create post', data: body });
}

// PUT /api/posts
export async function PUT(request: NextRequest) {
  return NextResponse.json({ message: 'Update all posts' });
}

// PATCH /api/posts
export async function PATCH(request: NextRequest) {
  return NextResponse.json({ message: 'Partially update posts' });
}

// DELETE /api/posts
export async function DELETE(request: NextRequest) {
  return NextResponse.json({ message: 'Delete all posts' });
}
```

---

## Input Validation with Zod

### Define Schemas

```typescript
// src/lib/schemas.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().optional(),
  published: z.boolean().default(false),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
```

### Validate in Route Handler

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPostSchema } from '@/lib/schemas';
import { PostService } from '@/services/post.service';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = requireAuth(request);

    // 2. Parse and validate input
    const body = await request.json();
    const result = createPostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 3. Create post
    const post = await PostService.create({
      ...result.data,
      authorId: user.userId,
    });

    // 4. Return created resource
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}
```

---

## Query Parameters

### Extract Query Params

```typescript
// GET /api/posts?page=1&limit=10&published=true
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const published = searchParams.get('published') === 'true';

  const posts = await PostService.findAll({ page, limit, published });
  
  return NextResponse.json(posts);
}
```

### Validate Query Params

```typescript
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  published: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Convert searchParams to object
  const params = Object.fromEntries(searchParams.entries());
  
  // Validate
  const result = querySchema.safeParse(params);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { page, limit, published, search } = result.data;
  
  const posts = await PostService.findAll({ page, limit, published, search });
  
  return NextResponse.json(posts);
}
```

---

## Dynamic Routes

### Route Parameters

```typescript
// app/api/posts/[id]/route.ts
interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/123
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return NextResponse.json(
      { error: 'Invalid post ID' },
      { status: 400 }
    );
  }

  const post = await PostService.findById(postId);
  
  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(post);
}

// PATCH /api/posts/123
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const user = requireAuth(request);
  const { id } = await params;
  const postId = parseInt(id, 10);

  const body = await request.json();
  const result = updatePostSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const post = await PostService.update(postId, result.data, user.userId);
  
  if (!post) {
    return NextResponse.json(
      { error: 'Post not found or unauthorized' },
      { status: 404 }
    );
  }

  return NextResponse.json(post);
}

// DELETE /api/posts/123
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const user = requireAuth(request);
  const { id } = await params;
  const postId = parseInt(id, 10);

  const success = await PostService.delete(postId, user.userId);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Post not found or unauthorized' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true }, { status: 204 });
}
```

### Catch-All Routes

```typescript
// app/api/files/[...path]/route.ts
interface CatchAllParams {
  params: Promise<{ path: string[] }>;
}

// Matches /api/files/a, /api/files/a/b, /api/files/a/b/c, etc.
export async function GET(
  request: NextRequest,
  { params }: CatchAllParams
) {
  const { path } = await params;
  const filePath = path.join('/');
  
  return NextResponse.json({ path: filePath });
}
```

---

## Error Handling

### Standardized Error Response

```typescript
// src/lib/api-error.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  console.error('Unexpected error:', error);
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Use in Route Handlers

```typescript
// app/api/posts/[id]/route.ts
import { errorResponse, APIError } from '@/lib/api-error';

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      throw new APIError('Invalid post ID', 400, 'INVALID_ID');
    }

    const post = await PostService.findById(postId);
    
    if (!post) {
      throw new APIError('Post not found', 404, 'NOT_FOUND');
    }

    return NextResponse.json(post);
  } catch (error) {
    return errorResponse(error);
  }
}
```

---

## Response Helpers

### Success Responses

```typescript
// src/lib/api-response.ts
import { NextResponse } from 'next/server';

export function success<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return NextResponse.json({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrev: page > 1,
    },
  });
}
```

### Usage

```typescript
import { success, created, paginated } from '@/lib/api-response';

// GET /api/posts
export async function GET(request: NextRequest) {
  const result = await PostService.findAll({ page: 1, pageSize: 10 });
  
  return paginated(
    result.items,
    result.page,
    result.pageSize,
    result.total
  );
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const post = await PostService.create(data);
  return created(post);
}
```

---

## CORS Configuration

### Enable CORS

```typescript
// app/api/posts/route.ts
export async function GET(request: NextRequest) {
  const posts = await PostService.findAll();
  
  return NextResponse.json(posts, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

### Middleware CORS

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const response = NextResponse.next();

  // Add CORS headers to all API responses
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## Pagination

### Offset-Based Pagination

```typescript
// app/api/posts/route.ts
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const { page, limit } = querySchema.parse(params);

  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    PostService.findMany({ offset, limit }),
    PostService.count(),
  ]);

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    },
  });
}
```

### Cursor-Based Pagination

```typescript
const querySchema = z.object({
  cursor: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const { cursor, limit } = querySchema.parse(params);

  const items = await PostService.findMany({ cursor, limit });
  
  const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

  return NextResponse.json({
    items,
    nextCursor,
    hasMore: items.length === limit,
  });
}
```

---

## File Uploads

### Handle File Upload

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      );
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

---

## Streaming Responses

### Server-Sent Events (SSE)

```typescript
// app/api/stream/route.ts
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        const data = `data: ${JSON.stringify({ count: i, timestamp: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(data));
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## Testing API Routes

### Unit Tests with Vitest

```typescript
// __tests__/api/posts.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/posts/route';
import { NextRequest } from 'next/server';

describe('POST /api/posts', () => {
  it('should create post with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'token=valid-jwt-token',
      },
      body: JSON.stringify({
        title: 'Test Post',
        content: 'This is test content',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.title).toBe('Test Post');
  });

  it('should reject invalid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'x' }), // Too short
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });
});

describe('GET /api/posts', () => {
  it('should return paginated posts', async () => {
    const request = new NextRequest('http://localhost:3000/api/posts?page=1&limit=10');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.items)).toBe(true);
  });
});
```

---

## Best Practices

### 1. Use Service Layer

**❌ Don't query database directly in routes:**
```typescript
export async function GET() {
  const posts = await db.select().from(posts); // ❌ Bad
  return NextResponse.json(posts);
}
```

**✅ Use services:**
```typescript
export async function GET() {
  const posts = await PostService.findAll(); // ✅ Good
  return NextResponse.json(posts);
}
```

### 2. Validate All Inputs

```typescript
// ✅ Always validate with Zod
const result = schema.safeParse(data);
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
```

### 3. Handle Errors Consistently

```typescript
// ✅ Use try-catch and error response helper
try {
  const post = await PostService.create(data);
  return created(post);
} catch (error) {
  return errorResponse(error);
}
```

### 4. Set Appropriate Status Codes

```
200 OK - Successful GET, PUT, PATCH
201 Created - Successful POST
204 No Content - Successful DELETE
400 Bad Request - Validation errors
401 Unauthorized - Missing/invalid authentication
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
409 Conflict - Duplicate/conflicting resource
500 Internal Server Error - Unexpected errors
```

### 5. Use Type-Safe Params

```typescript
// ✅ Type route params
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  // ...
}
```

---

**Last Updated:** February 7, 2026  
**Version:** 1.0.0
