import Link from 'next/link';
import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="container px-4">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center space-y-6 pb-8 pt-16 md:pb-12 md:pt-24 lg:py-32">
        <div className="flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Build full-stack apps{' '}
            <span className="text-primary">faster</span>
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            A production-ready Next.js template with authentication, database, and UI components.
            Start building immediately.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/blog">
              <Button variant="outline" size="lg">
                Read Blog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid gap-6 pb-16 md:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="App Router"
          description="Built on Next.js 14 App Router with Server Components and streaming."
        />
        <FeatureCard
          title="Authentication"
          description="JWT-based auth with protected routes, middleware, and role-based access."
        />
        <FeatureCard
          title="Database"
          description="Drizzle ORM with SQLite for development, ready for PostgreSQL in production."
        />
        <FeatureCard
          title="UI Components"
          description="Shadcn/ui-compatible components with Tailwind CSS and dark mode support."
        />
        <FeatureCard
          title="Type Safety"
          description="End-to-end TypeScript with Zod validation for runtime safety."
        />
        <FeatureCard
          title="Testing"
          description="Vitest + React Testing Library for unit tests, Playwright for E2E."
        />
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
