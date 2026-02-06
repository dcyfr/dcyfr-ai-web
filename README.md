# @dcyfr/ai-web

Production-ready full-stack Next.js web application template with App Router, Drizzle ORM, JWT authentication, and Tailwind CSS.

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

Open [http://localhost:3000](http://localhost:3000).

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
- Default to Server Components (no `'use client'` directive)
- Client Components only for interactivity (forms, state hooks)

### Database Access
- Use service classes (`UserService`, `PostService`) for all DB operations
- Drizzle ORM with `better-sqlite3` for dev, swap to PostgreSQL for production
- Raw SQL migrations for reliability

### Zod Validation
- All API inputs validated with Zod schemas
- Type-safe with inferred types (`RegisterInput`, `CreatePostInput`, etc.)

## License

MIT © 2026 DCYFR
