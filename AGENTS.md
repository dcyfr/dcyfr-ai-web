# AGENTS.md - dcyfr-ai-web

## Overview
Full-stack Next.js 14 web application template using App Router, Drizzle ORM, JWT auth, Tailwind CSS, and Shadcn/ui-compatible components.

## Architecture
- **Frontend:** Next.js App Router with Server + Client Components
- **Backend:** Next.js API routes with Zod validation
- **Database:** Drizzle ORM + better-sqlite3 (dev), PostgreSQL-ready (prod)
- **Auth:** JWT with cookie-based middleware protection
- **UI:** Shadcn/ui pattern with CSS variables
- **State:** Zustand stores (auth, theme)

## Key Conventions
1. Server Components by default — `'use client'` only for interactivity
2. Services layer for all database operations
3. Zod schemas for API validation with inferred types
4. Barrel exports from all component/module directories
5. Middleware protects `/dashboard` routes via cookie JWT

## Commands
```bash
npm run dev           # Development server
npm run build         # Production build
npm run test:run      # 73 tests
npm run typecheck     # TypeScript check
npm run db:migrate    # Run migrations
npm run db:seed       # Seed data
```

## Testing Summary
- 10 test files, 73 tests
- Lib: errors (7), auth (5), utils (9), schemas (14)
- Services: user (9), post (10)
- Components: button (6), input (5), card (2), badge+spinner (6)
