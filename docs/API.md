<!-- TLP:GREEN - Professional Use -->

# API Documentation: @dcyfr/ai-web

**Information Classification:** TLP:GREEN (Professional Use)  
**Package:** @dcyfr/ai-web v1.0.0  
**Description:** Production-ready full-stack Next.js web application template with App Router, Drizzle ORM, JWT auth, and Tailwind CSS  

---

## Overview

`@dcyfr/ai-web` is a comprehensive Next.js 15 web application template designed for rapid development of modern, scalable web applications. Built with the latest technologies and best practices, it provides a solid foundation for AI-powered applications, dashboards, and enterprise web solutions.

### Key Features

- **🚀 Next.js 15** - App Router, Server Components, Edge runtime support
- **🔐 JWT Authentication** - Secure user authentication with bcryptjs
- **🗃️ Drizzle ORM** - Type-safe database operations with PostgreSQL/SQLite support  
- **🎨 Tailwind CSS** - Utility-first CSS framework with custom design system
- **⚡ Performance Optimized** - Static generation, edge functions, image optimization
- **📱 Responsive Design** - Mobile-first approach with fluid layouts
- **🛡️ Security First** - CSRF protection, sanitized inputs, secure headers
- **🧪 Testing Ready** - Jest, Testing Library, and E2E test setups

---

## Installation

```bash
npm install @dcyfr/ai-web
# or
yarn add @dcyfr/ai-web
# or
pnpm add @dcyfr/ai-web
```

### Development Setup

```bash
# Clone or use as template
git clone <repository-url>
cd ai-web-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
npm run db:push

# Start development server
npm run dev
```

---

## Core Components

### Authentication System

The template includes a complete JWT-based authentication system with secure password hashing and session management.

#### Login Component

```typescript
import { LoginForm } from '@/components/auth/login-form'
import { AuthLayout } from '@/components/layouts/auth-layout'

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm 
        onSuccess={(token) => {
          // Handle successful login
          localStorage.setItem('authToken', token)
          router.push('/dashboard')
        }}
        onError={(error) => {
          // Handle login error
          showToast(error.message, 'error')
        }}
      />
    </AuthLayout>
  )
}
```

#### Registration Component

```typescript
import { RegisterForm } from '@/components/auth/register-form'

export function UserRegistration() {
  const handleRegister = async (userData: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok) {
        throw new Error('Registration failed')
      }
      
      const { token, user } = await response.json()
      return { token, user }
    } catch (error) {
      throw error
    }
  }

  return (
    <RegisterForm 
      onSubmit={handleRegister}
      validationRules={{
        email: { required: true, email: true },
        password: { minLength: 8, requireSpecialChar: true },
        confirmPassword: { mustMatch: 'password' }
      }}
    />
  )
}
```

#### Protected Routes

```typescript
import { withAuth } from '@/lib/auth/with-auth'
import { UserProfile } from '@/components/user/profile'

function ProfilePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <UserProfile />
    </div>
  )
}

// Protect the page with authentication
export default withAuth(ProfilePage, {
  requiredRole: 'user',
  redirectTo: '/login'
})
```

### Database Integration

Built-in integration with Drizzle ORM for type-safe database operations.

#### Schema Definition

```typescript
// src/lib/db/schema.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

#### Database Operations

```typescript
import { db } from '@/lib/db'
import { users, posts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// Create user
export async function createUser(userData: {
  email: string
  password: string
  name: string
}) {
  const passwordHash = await bcrypt.hash(userData.password, 12)
  
  const [newUser] = await db.insert(users)
    .values({
      email: userData.email,
      passwordHash,
      name: userData.name,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    
  return newUser
}

// Get user with posts
export async function getUserWithPosts(userId: string) {
  const userWithPosts = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      posts: {
        id: posts.id,
        title: posts.title,
        content: posts.content,
        publishedAt: posts.publishedAt,
      }
    })
    .from(users)
    .leftJoin(posts, eq(posts.authorId, users.id))
    .where(eq(users.id, userId))
    .orderBy(desc(posts.createdAt))
    
  return userWithPosts
}
```

### UI Components Library

A comprehensive set of pre-built, accessible UI components.

#### Button Component

```typescript
import { Button } from '@/components/ui/button'

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Loading state
<Button loading disabled>
  Processing...
</Button>

// With icon
<Button icon={<SaveIcon className="w-4 h-4" />}>
  Save Changes
</Button>

// Async action
<Button 
  onClick={async () => {
    await saveData()
    showToast('Data saved!', 'success')
  }}
>
  Save
</Button>
```

#### Form Components

```typescript
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'

function ContactForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      category: '',
      message: '',
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your name" 
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <option value="">Select category</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
                <option value="feedback">Feedback</option>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Your message..."
                  rows={4}
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">
          Send Message
        </Button>
      </form>
    </Form>
  )
}
```

### Layout System

Flexible layout components for different page types.

#### App Layout

```typescript
import { AppLayout } from '@/components/layouts/app-layout'
import { Sidebar } from '@/components/navigation/sidebar'
import { Header } from '@/components/navigation/header'

export default function DashboardPage() {
  return (
    <AppLayout
      header={<Header user={currentUser} />}
      sidebar={<Sidebar items={navigationItems} />}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analytics', href: '/dashboard/analytics' },
      ]}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
        {/* Page content */}
      </div>
    </AppLayout>
  )
}
```

#### Marketing Layout

```typescript
import { MarketingLayout } from '@/components/layouts/marketing-layout'

export default function LandingPage() {
  return (
    <MarketingLayout>
      <Hero 
        title="Build Something Amazing"
        subtitle="The fastest way to build modern web applications"
        cta={{
          text: "Get Started Free",
          href: "/register"
        }}
      />
      
      <Features 
        items={[
          {
            title: "Lightning Fast",
            description: "Built on Next.js 15 with optimized performance",
            icon: <ZapIcon />
          },
          {
            title: "Secure by Default", 
            description: "JWT auth, CSRF protection, and secure headers",
            icon: <ShieldIcon />
          }
        ]}
      />
      
      <CTA 
        title="Ready to get started?"
        description="Join thousands of developers building with our template"
        primaryAction={{ text: "Start Building", href: "/register" }}
        secondaryAction={{ text: "View Demo", href: "/demo" }}
      />
    </MarketingLayout>
  )
}
```

---

## API Routes

The template includes RESTful API routes with built-in authentication, validation, and error handling.

### Authentication Routes

#### POST /api/auth/register

```typescript
// Register new user
const registerData = {
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe'
}

const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registerData),
})

const { user, token } = await response.json()

// Response format:
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token-here"
}
```

#### POST /api/auth/login

```typescript
// User login
const loginData = {
  email: 'user@example.com',
  password: 'securePassword123'
}

const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData),
})

const { user, token } = await response.json()
```

#### GET /api/auth/me

```typescript
// Get current user info (requires auth token)
const response = await fetch('/api/auth/me', {
  headers: { 
    'Authorization': `Bearer ${token}` 
  },
})

const user = await response.json()

// Response format:
{
  "id": "uuid",
  "email": "user@example.com", 
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### CRUD Operations

#### GET /api/posts

```typescript
// Get paginated posts
const response = await fetch('/api/posts?page=1&limit=10&sort=createdAt&order=desc')
const { posts, pagination } = await response.json()

// Response format:
{
  "posts": [
    {
      "id": "uuid",
      "title": "Post Title",
      "content": "Post content...", 
      "author": {
        "id": "uuid",
        "name": "Author Name"
      },
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### POST /api/posts

```typescript
// Create new post (requires authentication)
const postData = {
  title: 'My New Post',
  content: 'This is the post content...',
  publishedAt: '2024-01-01T12:00:00.000Z' // Optional, null for draft
}

const response = await fetch('/api/posts', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  },
  body: JSON.stringify(postData),
})

const newPost = await response.json()
```

---

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="My AI Web App"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Storage (optional)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket"
```

### Database Configuration

#### PostgreSQL Setup

```bash
# Using Docker
docker run --name postgres-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  -d postgres:15

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/myapp"

# Push schema to database
npm run db:push
```

#### SQLite Setup (Development)

```env
# Use SQLite for local development
DATABASE_URL="file:./dev.db"
```

### Tailwind Configuration

Customize the design system in `tailwind.config.js`:

```javascript
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6', 
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          500: '#6b7280',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

## Styling and Theming

### Design Tokens

The template uses a consistent design token system:

```css
/* src/styles/globals.css */
:root {
  /* Colors */
  --primary-50: 239 246 255;
  --primary-500: 59 130 246;
  --primary-900: 30 58 138;
  
  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-4: 1rem;
  --space-8: 2rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --primary-50: 30 58 138;
    --primary-500: 59 130 246;
    --primary-900: 239 246 255;
  }
}
```

### Component Variants

```typescript
// src/lib/utils/variants.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Button variants
export const buttonVariants = {
  variant: {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
  },
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  },
}
```

### Responsive Design

```typescript
// Mobile-first responsive component
function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      // Mobile (default)
      "grid grid-cols-1 gap-4 p-4",
      // Tablet
      "md:grid-cols-2 md:gap-6 md:p-6",
      // Desktop
      "lg:grid-cols-3 lg:gap-8 lg:p-8",
      // Extra large
      "xl:grid-cols-4 xl:gap-10"
    )}>
      {children}
    </div>
  )
}
```

---

## Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image'

// Optimized image component
export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height,
  priority = false 
}: {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      className="rounded-lg object-cover"
    />
  )
}
```

### Server Components

```typescript
// Server component (runs on server)
export default async function PostsPage() {
  // Direct database access in server component
  const posts = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.createdAt))
    .limit(10)

  return (
    <div>
      <h1>Latest Posts</h1>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

// Client component (runs in browser)
'use client'
export function InteractivePostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)
  
  const handleLike = async () => {
    await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
    setLiked(true)
  }

  return (
    <div className="border rounded-lg p-4">
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <Button onClick={handleLike} disabled={liked}>
        {liked ? 'Liked' : 'Like'} ({post.likes})
      </Button>
    </div>
  )
}
```

### Static Generation

```typescript
// Static page with ISR (Incremental Static Regeneration)
export default async function BlogPage() {
  const posts = await fetchPosts()
  
  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map(post => (
        <BlogPostPreview key={post.id} post={post} />
      ))}
    </div>
  )
}

// Revalidate every hour
export const revalidate = 3600
```

---

## Testing

### Unit Testing

```typescript
// src/components/ui/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  test('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('applies variant styles', () => {
    render(<Button variant="primary">Primary Button</Button>)
    const button = screen.getByText('Primary Button')
    expect(button).toHaveClass('bg-primary-500')
  })

  test('shows loading state', () => {
    render(<Button loading>Loading...</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

### API Testing

```typescript
// src/api/__tests__/auth.test.ts
import { POST as registerHandler } from '../auth/register/route'
import { createMockRequest } from '@/lib/test-utils'

describe('/api/auth/register', () => {
  test('creates new user with valid data', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }
    })

    const response = await registerHandler(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user.email).toBe('test@example.com')
    expect(data.token).toBeDefined()
  })

  test('rejects duplicate email', async () => {
    // First registration
    await registerUser({ email: 'duplicate@test.com' })

    // Second registration with same email
    const request = createMockRequest({
      method: 'POST', 
      body: {
        email: 'duplicate@test.com',
        password: 'password123',
        name: 'Test User 2'
      }
    })

    const response = await registerHandler(request)
    expect(response.status).toBe(400)
  })
})
```

### E2E Testing

```typescript
// e2e/auth.spec.ts (Playwright)
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    // Registration
    await page.goto('/register')
    await page.fill('[data-testid="email-input"]', 'e2e@test.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.fill('[data-testid="name-input"]', 'E2E Test User')
    await page.click('[data-testid="register-button"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome')

    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')

    // Login
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'e2e@test.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')

    // Should be back at dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('displays validation errors for invalid input', async ({ page }) => {
    await page.goto('/register')
    await page.click('[data-testid="register-button"]')

    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required')
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required')
  })
})
```

---

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard or via CLI
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

```bash
# Build and run with Docker
docker build -t ai-web-app .
docker run -p 3000:3000 ai-web-app
```

### Self-Hosted Deployment 

```nginx
# nginx.conf
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Security Features

### CSRF Protection

```typescript
// Built-in CSRF protection for forms
import { csrf } from '@/lib/security/csrf'

export async function POST(request: Request) {
  // Verify CSRF token
  await csrf.verify(request)
  
  // Process request...
}
```

### Input Sanitization

```typescript
import { sanitize } from '@/lib/security/sanitize'

export async function createPost(data: unknown) {
  const sanitized = sanitize(data, {
    title: 'string|max:100',
    content: 'string|html|max:5000',
    tags: 'array|string|max:20'
  })
  
  return await db.insert(posts).values(sanitized)
}
```

### Rate Limiting

```typescript
import { rateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  // Apply rate limiting (5 requests per minute)
  await rateLimit(request, '5/minute')
  
  // Process request...
}
```

---

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** with proper tests
4. **Run quality checks**: `npm run lint && npm run test`
5. **Commit**: `git commit -m 'Add amazing feature'`
6. **Push**: `git push origin feature/amazing-feature`
7. **Create Pull Request**

### Code Standards

- **ESLint**: Strict TypeScript configuration
- **Prettier**: Consistent code formatting
- **Tests**: >95% coverage required
- **TypeScript**: Strict mode enabled
- **Security**: No hardcoded secrets, OWASP compliance

---

## Support

### Issues and Bugs

Report issues on GitHub with:
- Detailed description of the problem
- Steps to reproduce
- Environment information
- Expected vs actual behavior

### Feature Requests

Submit feature requests with:
- Clear use case description
- Proposed implementation approach
- Impact on existing functionality

### Community

- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Real-time community support
- **Documentation**: Comprehensive guides and examples

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Package Information**  
- **Version**: 1.0.0
- **Author**: DCYFR Team  
- **Repository**: https://github.com/dcyfr/dcyfr-ai-web
- **Bugs**: https://github.com/dcyfr/dcyfr-ai-web/issues
- **Homepage**: https://dcyfr.ai

**Dependencies**  
- Next.js 15+  
- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Drizzle ORM
- Node.js 18+

---

*This documentation covers the core features of @dcyfr/ai-web v1.0.0. For the latest updates and advanced usage examples, visit the [official documentation](https://docs.dcyfr.ai/ai-web).*