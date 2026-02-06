import { createDb } from './connection';
import { migrate } from './migrate';
import { users, posts } from './schema';
import { hashSync } from 'bcryptjs';

async function seed(): Promise<void> {
  const { orm, sqlite } = createDb();
  migrate(sqlite);

  console.log('🌱 Seeding database...');

  // Create users
  const [admin] = orm
    .insert(users)
    .values({
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: hashSync('password123', 10),
      role: 'admin',
    })
    .returning()
    .all();

  const [user] = orm
    .insert(users)
    .values({
      email: 'user@example.com',
      name: 'Regular User',
      passwordHash: hashSync('password123', 10),
      role: 'user',
    })
    .returning()
    .all();

  // Create posts
  orm
    .insert(posts)
    .values([
      {
        title: 'Getting Started with Next.js',
        slug: 'getting-started-nextjs',
        content:
          'Next.js is a React framework for building full-stack web applications. You use React Components to build user interfaces, and Next.js for additional features and optimizations.',
        excerpt: 'Learn the basics of Next.js App Router and Server Components.',
        published: true,
        authorId: admin.id,
      },
      {
        title: 'Understanding Server Components',
        slug: 'understanding-server-components',
        content:
          'Server Components allow you to write UI that can be rendered and optionally cached on the server. In Next.js, the rendering work is further split by route segments.',
        excerpt: 'Deep dive into React Server Components architecture.',
        published: true,
        authorId: admin.id,
      },
      {
        title: 'Draft: Advanced Patterns',
        slug: 'draft-advanced-patterns',
        content: 'This is a draft post about advanced Next.js patterns.',
        published: false,
        authorId: user.id,
      },
    ])
    .run();

  console.log('✅ Seed complete');
  console.log(`   Created ${2} users (admin + user)`);
  console.log(`   Created ${3} posts (2 published, 1 draft)`);
}

seed().catch(console.error);
