# Database Guide - Drizzle ORM

**Target Audience:** Full-stack developers, backend engineers  
**Prerequisites:** TypeScript knowledge, basic SQL understanding

---

## Overview

This template uses **Drizzle ORM** with SQLite for development and supports PostgreSQL/MySQL for production. Drizzle provides type-safe database access with minimal runtime overhead.

---

## Schema Design

### Define Tables

```typescript
// src/db/schema.ts
import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(), // Hashed with bcrypt
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});
```

### Type Inference

```typescript
// Automatically infer TypeScript types from schema
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// Usage
const user: User = {
  id: 1,
  email: 'user@example.com',
  name: 'John Doe',
  password: 'hashed...',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const newUser: InsertUser = {
  email: 'jane@example.com',
  name: 'Jane Smith',
  password: 'hashed...',
  // id, createdAt, updatedAt auto-filled
};
```

---

## Migrations

### Generate Migrations

```bash
# After changing schema, generate migration
npm run db:generate

# Creates migration file in drizzle/ folder
# Example: drizzle/0001_add_posts_table.sql
```

### Apply Migrations

```bash
# Run pending migrations
npm run db:migrate

# Migrations are tracked in __drizzle_migrations table
```

### Manual Migration

```sql
-- drizzle/0001_add_posts_table.sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  published INTEGER DEFAULT 0 NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_slug ON posts(slug);
```

---

## CRUD Operations

### Create (Insert)

```typescript
import { db } from '@/db/connection';
import { users, type InsertUser } from '@/db/schema';

// Insert single user
const newUser: InsertUser = {
  email: 'john@example.com',
  name: 'John Doe',
  password: await hashPassword('password123'),
};

const [user] = await db.insert(users).values(newUser).returning();

console.log(user.id); // Auto-incremented ID
```

**Insert Multiple:**
```typescript
const newUsers: InsertUser[] = [
  { email: 'alice@example.com', name: 'Alice', password: 'hash1' },
  { email: 'bob@example.com', name: 'Bob', password: 'hash2' },
];

const insertedUsers = await db.insert(users).values(newUsers).returning();
```

### Read (Select)

```typescript
import { eq, and, or, like, gte, lte } from 'drizzle-orm';

// Select all users
const allUsers = await db.select().from(users);

// Select single user by ID
const user = await db.select().from(users).where(eq(users.id, 1));

// Select with conditions
const admins = await db.select().from(users).where(eq(users.role, 'admin'));

// Multiple conditions (AND)
const activeAdmins = await db
  .select()
  .from(users)
  .where(and(eq(users.role, 'admin'), gte(users.createdAt, new Date('2024-01-01'))));

// OR conditions
const emailOrName = await db
  .select()
  .from(users)
  .where(or(eq(users.email, 'john@example.com'), like(users.name, '%John%')));

// Select specific columns
const userEmails = await db.select({ email: users.email }).from(users);

// Order and limit
const recent = await db
  .select()
  .from(users)
  .orderBy(users.createdAt)
  .limit(10);
```

### Update

```typescript
// Update single user
await db
  .update(users)
  .set({ name: 'John Smith' })
  .where(eq(users.id, 1));

// Update multiple fields
await db
  .update(users)
  .set({
    name: 'Jane Doe',
    updatedAt: new Date(),
  })
  .where(eq(users.email, 'jane@example.com'));

// Return updated row
const [updated] = await db
  .update(users)
  .set({ role: 'admin' })
  .where(eq(users.id, 1))
  .returning();
```

### Delete

```typescript
// Delete by ID
await db.delete(users).where(eq(users.id, 1));

// Delete with condition
await db.delete(posts).where(eq(posts.published, false));

// Delete and return deleted rows
const deleted = await db
  .delete(users)
  .where(eq(users.role, 'user'))
  .returning();
```

---

## Relationships & Joins

### One-to-Many

```typescript
import { posts, users } from '@/db/schema';

// Posts with author information
const postsWithAuthors = await db
  .select({
    id: posts.id,
    title: posts.title,
    content: posts.content,
    authorName: users.name,
    authorEmail: users.email,
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id));

// Result type is inferred
console.log(postsWithAuthors[0].authorName); // Type-safe access
```

### Nested Selects with Relations

```typescript
// Define relations in schema
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

// Use relations in queries
import { db } from '@/db/connection';

const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true,
  },
});

// Access nested data
usersWithPosts.forEach((user) => {
  console.log(user.name);
  user.posts.forEach((post) => {
    console.log(`  - ${post.title}`);
  });
});
```

### Filter Related Records

```typescript
// Get users with published posts
const authorsWithPublishedPosts = await db.query.users.findMany({
  with: {
    posts: {
      where: eq(posts.published, true),
    },
  },
});
```

---

## Advanced Patterns

### Transactions

```typescript
import { db } from '@/db/connection';

await db.transaction(async (tx) => {
  // Create user
  const [user] = await tx.insert(users).values({
    email: 'author@example.com',
    name: 'Author',
    password: 'hash',
  }).returning();

  // Create posts for user
  await tx.insert(posts).values([
    { title: 'Post 1', slug: 'post-1', content: 'Content 1', authorId: user.id },
    { title: 'Post 2', slug: 'post-2', content: 'Content 2', authorId: user.id },
  ]);

  // If any operation fails, entire transaction rolls back
});
```

### Pagination

```typescript
interface PaginateOptions {
  page: number;
  pageSize: number;
}

async function paginatePosts({ page, pageSize }: PaginateOptions) {
  const offset = (page - 1) * pageSize;

  const items = await db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(posts.createdAt)
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.published, true));

  return {
    items,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

// Usage
const result = await paginatePosts({ page: 1, pageSize: 10 });
```

### Full-Text Search

```typescript
import { like, or } from 'drizzle-orm';

async function searchPosts(query: string) {
  const pattern = `%${query}%`;
  
  return db
    .select()
    .from(posts)
    .where(
      or(
        like(posts.title, pattern),
        like(posts.content, pattern),
        like(posts.excerpt, pattern)
      )
    );
}

// Usage
const results = await searchPosts('drizzle');
```

### Aggregations

```typescript
import { count, sum, avg, min, max } from 'drizzle-orm';

// Count posts per user
const postCounts = await db
  .select({
    userId: posts.authorId,
    postCount: count(posts.id),
  })
  .from(posts)
  .groupBy(posts.authorId);

// Stats
const stats = await db
  .select({
    totalPosts: count(posts.id),
    publishedPosts: count(posts.id).where(eq(posts.published, true)),
  })
  .from(posts);
```

---

## Database Seeding

```typescript
// src/db/seed.ts
import { db } from './connection';
import { users, posts } from './schema';
import { hashPassword } from '@/lib/auth';

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.delete(posts);
  await db.delete(users);

  // Create users
  const [admin, author] = await db.insert(users).values([
    {
      email: 'admin@example.com',
      name: 'Admin User',
      password: await hashPassword('admin123'),
      role: 'admin',
    },
    {
      email: 'author@example.com',
      name: 'John Doe',
      password: await hashPassword('password123'),
      role: 'user',
    },
  ]).returning();

  // Create posts
  await db.insert(posts).values([
    {
      title: 'Getting Started with Drizzle ORM',
      slug: 'getting-started-drizzle',
      content: 'Drizzle is a TypeScript ORM...',
      excerpt: 'Learn the basics of Drizzle ORM',
      published: true,
      authorId: author.id,
    },
    {
      title: 'Advanced TypeScript Patterns',
      slug: 'advanced-typescript',
      content: 'Explore advanced TS patterns...',
      excerpt: 'Deep dive into TypeScript',
      published: true,
      authorId: author.id,
    },
  ]);

  console.log('✅ Seed complete!');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
```

Run seed:
```bash
npm run db:seed
```

---

## Switching to PostgreSQL

### Update Schema

```typescript
// src/db/schema.ts
import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').$type<'user' | 'admin'>().notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  published: boolean('published').notNull().default(false),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### Update Connection

```typescript
// src/db/connection.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### Install Dependencies

```bash
npm uninstall better-sqlite3
npm install pg drizzle-orm
npm install -D @types/pg
```

---

## Best Practices

### 1. Use Service Layer

**❌ Don't query directly in API routes:**
```typescript
// app/api/users/route.ts
export async function GET() {
  const users = await db.select().from(users); // ❌ Bad
  return Response.json(users);
}
```

**✅ Use service classes:**
```typescript
// services/user.service.ts
export class UserService {
  static async findAll() {
    return db.select().from(users);
  }
}

// app/api/users/route.ts
export async function GET() {
  const users = await UserService.findAll(); // ✅ Good
  return Response.json(users);
}
```

### 2. Type Safety

```typescript
// ✅ Use inferred types
type User = typeof users.$inferSelect;

// ✅ Use Zod for validation + inference
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

type CreateUserInput = z.infer<typeof createUserSchema>;
```

### 3. Index Important Columns

```sql
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_users_email ON users(email);
```

### 4. Use Transactions for Multiple Operations

```typescript
// ✅ Atomic operations
await db.transaction(async (tx) => {
  await tx.delete(posts).where(eq(posts.authorId, userId));
  await tx.delete(users).where(eq(users.id, userId));
});
```

---

**Last Updated:** February 7, 2026  
**Version:** 1.0.0
