# @dcyfr/ai-web

**Production-ready full-stack Next.js web application template** with App Router, Drizzle ORM, JWT authentication, and Tailwind CSS.

Perfect for building modern web applications with type-safe APIs, server-side rendering, and production-grade architecture patterns.

> **📦 Starter Template** — This is a **starter template** for cloning, not an npm package. Use `git clone` or download the source to create your own full-stack web application. This package is marked `private: true` and is not published to npm.

## Features

✅ **Modern Stack** — Next.js 14 App Router with TypeScript 5.7+  
✅ **Database** — Drizzle ORM with SQLite (dev) / PostgreSQL (production)  
✅ **Authentication** — JWT-based auth with httpOnly cookies  
✅ **Validation** — Zod schemas for all API inputs  
✅ **UI Components** — Shadcn/ui-compatible component library  
✅ **Testing** — 73 tests with Vitest + React Testing Library  
✅ **Type-Safe** — End-to-end type safety with TypeScript + Zod  
✅ **Production-Ready** — Health checks, error handling, middleware protection

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.7+ |
| Styling | Tailwind CSS | 3.4 |
| UI Components | Shadcn/ui pattern | - |
| Database | Drizzle ORM + SQLite | 0.38+ |
| Auth | JWT (jsonwebtoken) | 9.x |
| Validation | Zod | 3.24+ |
| State | Zustand | 5.x |
| Testing | Vitest + RTL | 2.1 |

## Quick Start

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed with sample data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### First Steps After Installation

1. **Create your first user:**
   - Navigate to [http://localhost:3000/register](http://localhost:3000/register)
   - Register with email/password
   - JWT token automatically stored in httpOnly cookie

2. **Access protected dashboard:**
   - Login at [http://localhost:3000/login](http://localhost:3000/login)
   - Redirects to `/dashboard` when authenticated

3. **Create blog posts:**
   - Use `/dashboard` to create new posts
   - Posts appear at `/blog` when published

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with Navbar + Footer
│   ├── page.tsx           # Home page (hero + features)
│   ├── not-found.tsx      # 404 page
│   ├── login/page.tsx     # Login form (client component)
│   ├── register/page.tsx  # Registration form (client component)
│   ├── blog/              # Blog listing + [slug] detail
│   ├── dashboard/         # Protected dashboard with stats
│   └── api/
│       ├── auth/          # POST /register, POST /login
│       ├── posts/         # GET/POST /posts, GET/PATCH/DELETE /posts/[id]
│       └── health/        # GET /health
├── components/
│   ├── ui/                # Button, Input, Card, Badge, Spinner
│   └── layout/            # Navbar, Footer
├── db/                    # Drizzle schema, connection, migrations, seed
├── hooks/                 # useDebounce, useLocalStorage, useMediaQuery
├── lib/                   # Auth, errors, utils, schemas
├── services/              # UserService, PostService
├── stores/                # Zustand stores (auth, theme)
└── middleware.ts           # Route protection middleware
```

## Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Server | Landing page with hero and features |
| `/login` | Client | Login form with JWT auth |
| `/register` | Client | Registration form |
| `/blog` | Server | Published blog posts list |
| `/blog/[slug]` | Server | Individual blog post |
| `/dashboard` | Server | Protected user dashboard |

## API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | - | Create account + get JWT |
| POST | `/api/auth/login` | - | Authenticate + get JWT |
| GET | `/api/posts` | - | List published posts |
| POST | `/api/posts` | Bearer | Create new post |
| GET | `/api/posts/[id]` | - | Get post by ID |
| PATCH | `/api/posts/[id]` | Bearer | Update own post |
| DELETE | `/api/posts/[id]` | Bearer | Delete own post |
| GET | `/api/health` | - | Health check |

## Authentication

JWT-based auth with cookie storage for SSR middleware:

```typescript
// Login stores token as cookie
document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;

// Middleware checks cookie for /dashboard routes
// API routes check Authorization: Bearer <token> header
```

## UI Components

Shadcn/ui-compatible components with CSS variables for theming:

- **Button** — 6 variants (default, destructive, outline, secondary, ghost, link) × 4 sizes
- **Input** — With error state display
- **Card** — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Badge** — 4 variants (default, secondary, destructive, outline)
- **Spinner** — 3 sizes with sr-only loading text

## Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=./data/dev.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing

```bash
npm run test:run        # Run all tests (73 tests)
npm run test            # Watch mode
npm run test:coverage   # With coverage report
```

### Test Coverage

| Suite | Tests | Description |
|-------|-------|-------------|
| lib/errors | 7 | Error class hierarchy |
| lib/auth | 5 | Password hashing + JWT |
| lib/utils | 9 | cn, slugify, formatDate, truncate |
| lib/schemas | 14 | Zod validation schemas |
| services/user | 9 | CRUD + duplicate detection |
| services/post | 10 | CRUD + owner enforcement |
| components/button | 6 | Variants, sizes, ref, disabled |
| components/input | 5 | Rendering, error state, ref |
| components/card | 2 | Composition pattern |
| components/badge+spinner | 6 | Variants, sizes, accessibility |

## Patterns

### Server vs Client Components
- **Default to Server Components** (no `'use client'` directive) for better performance
- **Client Components only when needed:** Forms, event handlers, browser APIs, React hooks
- Middleware handles authentication for protected Server Components

### Database Access
- **Service layer pattern** — `UserService`, `PostService` isolate DB logic
- **Drizzle ORM** for type-safe queries with `better-sqlite3` (dev) or PostgreSQL (production)
- **Migrations** managed with Drizzle Kit (`npm run db:generate`, `npm run db:migrate`)

### Zod Validation
- All API inputs validated with Zod schemas in `src/lib/schemas.ts`
- Type-safe with inferred types: `RegisterInput`, `CreatePostInput`, etc.
- Validation errors return structured error messages for client display

## Documentation

Comprehensive guides available in `docs/` directory:

- **[DATABASE.md](docs/DATABASE.md)** — Drizzle ORM patterns, migrations, PostgreSQL migration
- **[AUTHENTICATION.md](docs/AUTHENTICATION.md)** — JWT implementation, middleware, security
- **[API_ROUTES.md](docs/API_ROUTES.md)** — Route handlers, validation, error handling
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Vercel, Railway, Docker, Kubernetes deployment

## Examples

Executable examples in `examples/` directory:

- **[api-client.ts](examples/api-client.ts)** — Type-safe API client with authentication
- **[custom-components.tsx](examples/custom-components.tsx)** — Build reusable UI components
- **[database-operations.ts](examples/database-operations.ts)** — Advanced Drizzle ORM patterns

### Using Examples

```typescript
// Import API client example
import { APIClient } from './examples/api-client';

const api = new APIClient();

// Register user
const { user } = await api.auth.register({
  email: 'john@example.com',
  name: 'John Doe',
  password: 'SecurePassword123!',
});

// Create post (requires authentication)
const post = await api.posts.create({
  title: 'My First Post',
  content: 'Content goes here...',
  published: true,
});
```

## Deployment

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# DATABASE_URL, JWT_SECRET, REFRESH_TOKEN_SECRET
```

### Docker Deployment

```bash
# Build image
docker build -t my-nextjs-app .

# Run with docker-compose
docker-compose up -d
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment guides (Vercel, Railway, Docker, Kubernetes).

### Production Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=min-32-char-secure-random-string
REFRESH_TOKEN_SECRET=another-secure-random-string
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Security Best Practices

✅ **JWT stored in httpOnly cookies** prevents XSS attacks  
✅ **Password hashing with bcrypt** (12 rounds)  
✅ **Zod validation** for all API inputs  
✅ **CORS configuration** for API routes  
✅ **Rate limiting** recommended for auth endpoints  
✅ **Environment variable validation** with Zod schemas

See [AUTHENTICATION.md](docs/AUTHENTICATION.md) for complete security guide.

## Performance

⚡ **Server Components by default** — Reduced JavaScript bundle size  
⚡ **Drizzle ORM** — Minimal runtime overhead, type-safe queries  
⚡ **Automatic code splitting** with Next.js App Router  
⚡ **Static generation** for blog pages (ISR-ready)  
⚡ **Database connection pooling** for production PostgreSQL

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run dev:debug        # Debug mode

# Building
npm run build            # Production build
npm run start            # Serve production build
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes (dev)
npm run db:seed          # Seed sample data
npm run db:studio        # Open Drizzle Studio

# Testing
npm run test             # Watch mode
npm run test:run         # Run all tests
npm run test:coverage    # With coverage report
npm run test:ui          # Vitest UI
```

## Troubleshooting

### Database Connection Issues

```
Error: Database is locked
```
**Solution:** SQLite doesn't support concurrent writes. Use PostgreSQL for production.

### JWT Verification Fails

```
Error: jwt malformed
```
**Solution:** Ensure `JWT_SECRET` environment variable is set correctly.

### Module Not Found

```
Error: Cannot find module '@/lib/auth'
```
**Solution:** Check `tsconfig.json` paths configuration, run `npm run build` to regenerate types.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Ensure all tests pass (`npm run test:run`) and code is linted (`npm run lint`).

## Roadmap

- [ ] OAuth providers (Google, GitHub)
- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Admin dashboard with RBAC
- [ ] Image upload with S3 integration
- [ ] Full-text search with PostgreSQL
- [ ] WebSocket support for real-time features
- [ ] API rate limiting middleware

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev)

## License

MIT © 2026 DCYFR

---

**Need help?** Open an issue or check the [documentation guides](docs/).
