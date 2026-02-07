/**
 * Database Operations Example - Advanced Drizzle ORM Patterns
 * 
 * This example demonstrates advanced database patterns using Drizzle ORM:
 *   - Complex queries with joins and aggregations
 *   - Transaction management
 *   - Optimistic concurrency control
 *   - Soft deletes
 *   - Audit logging
 *   - Bulk operations
 * 
 * Note: This file is for reference and learning. Copy patterns into your
 * services as needed.
 */

import { db } from '@/db/connection';
import { users, posts, type InsertUser, type InsertPost } from '@/db/schema';
import { eq, and, or, like, gte, lte, desc, asc, sql, count, avg } from 'drizzle-orm';

// ============================================================================
// Advanced Query Patterns
// ============================================================================

/**
 * Example 1: Complex Filtering with Multiple Conditions
 */
export async function findPostsAdvanced(filters: {
  authorEmail?: string;
  publishedAfter?: Date;
  searchTerm?: string;
  minLength?: number;
}) {
  const conditions = [];

  // Join with users if filtering by author email
  if (filters.authorEmail) {
    const author = await db.query.users.findFirst({
      where: eq(users.email, filters.authorEmail),
    });

    if (author) {
      conditions.push(eq(posts.authorId, author.id));
    } else {
      return []; // No matching author
    }
  }

  // Filter by publication date
  if (filters.publishedAfter) {
    conditions.push(gte(posts.createdAt, filters.publishedAfter));
  }

  // Full-text search across title and content
  if (filters.searchTerm) {
    const pattern = `%${filters.searchTerm}%`;
    conditions.push(
      or(
        like(posts.title, pattern),
        like(posts.content, pattern)
      )
    );
  }

  // Filter by content length (using SQL function)
  if (filters.minLength) {
    conditions.push(
      sql`length(${posts.content}) >= ${filters.minLength}`
    );
  }

  return db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt));
}

// Usage:
// const recentLongPosts = await findPostsAdvanced({
//   authorEmail: 'john@example.com',
//   publishedAfter: new Date('2024-01-01'),
//   searchTerm: 'typescript',
//   minLength: 1000,
// });

/**
 * Example 2: Aggregations and Group By
 */
export async function getPostStatsByAuthor() {
  return db
    .select({
      authorId: posts.authorId,
      authorName: users.name,
      authorEmail: users.email,
      totalPosts: count(posts.id),
      publishedPosts: count(posts.id).where(eq(posts.published, true)),
      avgContentLength: avg(sql`length(${posts.content})`).mapWith(Number),
      latestPost: sql<Date>`max(${posts.createdAt})`.mapWith((val) =>
        val ? new Date(val) : null
      ),
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .groupBy(posts.authorId, users.name, users.email)
    .orderBy(desc(count(posts.id)));
}

// Result:
// [
//   {
//     authorId: 1,
//     authorName: 'John Doe',
//     authorEmail: 'john@example.com',
//     totalPosts: 25,
//     publishedPosts: 20,
//     avgContentLength: 1500,
//     latestPost: Date('2024-02-01'),
//   },
//   ...
// ]

/**
 * Example 3: Nested Queries with Relations
 */
export async function getUsersWithPostCount() {
  // Using query builder with relations
  const usersWithPosts = await db.query.users.findMany({
    with: {
      posts: {
        columns: {
          id: true,
          published: true,
        },
      },
    },
  });

  // Transform to include counts
  return usersWithPosts.map((user) => ({
    ...user,
    postCount: user.posts.length,
    publishedCount: user.posts.filter((p) => p.published).length,
  }));
}

/**
 * Example 4: Subqueries - Find Users with Most Posts
 */
export async function getTopAuthors(limit: number = 10) {
  const postCounts = db
    .select({
      authorId: posts.authorId,
      postCount: count(posts.id).as('post_count'),
    })
    .from(posts)
    .groupBy(posts.authorId)
    .as('post_counts');

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      postCount: postCounts.postCount,
    })
    .from(users)
    .innerJoin(postCounts, eq(users.id, postCounts.authorId))
    .orderBy(desc(postCounts.postCount))
    .limit(limit);
}

// ============================================================================
// Transaction Patterns
// ============================================================================

/**
 * Example 5: Basic Transaction - Create User with Initial Post
 */
export async function createUserWithWelcomePost(userData: {
  email: string;
  name: string;
  password: string;
}) {
  return db.transaction(async (tx) => {
    // Create user
    const [user] = await tx
      .insert(users)
      .values({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      })
      .returning();

    // Create welcome post
    const [post] = await tx
      .insert(posts)
      .values({
        title: `Welcome, ${user.name}!`,
        slug: `welcome-${user.id}`,
        content: 'Welcome to our platform! Start by creating your first post.',
        published: false,
        authorId: user.id,
      })
      .returning();

    return { user, welcomePost: post };
  });
}

// If any operation fails, entire transaction rolls back
// Usage:
// const { user, welcomePost } = await createUserWithWelcomePost({
//   email: 'jane@example.com',
//   name: 'Jane Smith',
//   password: 'hashed-password',
// });

/**
 * Example 6: Transfer Post Ownership (Atomic)
 */
export async function transferPostOwnership(postId: number, newAuthorId: number) {
  return db.transaction(async (tx) => {
    // Verify new author exists
    const newAuthor = await tx
      .select()
      .from(users)
      .where(eq(users.id, newAuthorId))
      .limit(1);

    if (newAuthor.length === 0) {
      throw new Error('New author not found');
    }

    // Verify post exists
    const post = await tx
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      throw new Error('Post not found');
    }

    // Transfer ownership
    const [updated] = await tx
      .update(posts)
      .set({
        authorId: newAuthorId,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    return updated;
  });
}

// ============================================================================
// Soft Delete Pattern
// ============================================================================

/**
 * Example 7: Soft Delete Implementation
 * 
 * Instead of deleting records, mark them as deleted with a timestamp.
 * Allows recovery and maintains referential integrity.
 */

// First, extend schema to include deletedAt field:
// deletedAt: timestamp('deleted_at')

export async function softDeletePost(postId: number, userId: number) {
  const [deleted] = await db
    .update(posts)
    .set({
      // Uncomment if you add deletedAt column:
      // deletedAt: new Date(),
      published: false, // Unpublish as alternative
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
    .returning();

  return deleted;
}

export async function restorePost(postId: number, userId: number) {
  const [restored] = await db
    .update(posts)
    .set({
      // Uncomment if you add deletedAt column:
      // deletedAt: null,
      published: true, // Re-publish
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
    .returning();

  return restored;
}

/**
 * Example 8: Query Active (Non-Deleted) Records
 */
export async function findActivePosts() {
  return db
    .select()
    .from(posts)
    // Uncomment if you add deletedAt column:
    // .where(sql`${posts.deletedAt} IS NULL`)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt));
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Example 9: Bulk Insert with Returning
 */
export async function bulkCreatePosts(postsData: InsertPost[]) {
  const inserted = await db.insert(posts).values(postsData).returning();
  return inserted;
}

// Usage:
// const newPosts = await bulkCreatePosts([
//   { title: 'Post 1', slug: 'post-1', content: 'Content 1', authorId: 1 },
//   { title: 'Post 2', slug: 'post-2', content: 'Content 2', authorId: 1 },
//   { title: 'Post 3', slug: 'post-3', content: 'Content 3', authorId: 2 },
// ]);

/**
 * Example 10: Bulk Update with Conditions
 */
export async function publishAllDraftsByAuthor(authorId: number) {
  const updated = await db
    .update(posts)
    .set({
      published: true,
      updatedAt: new Date(),
    })
    .where(and(eq(posts.authorId, authorId), eq(posts.published, false)))
    .returning();

  return updated;
}

/**
 * Example 11: Upsert Pattern (Insert or Update)
 */
export async function upsertPost(
  slug: string,
  postData: Partial<InsertPost> & { title: string; content: string; authorId: number }
) {
  // Check if post exists
  const existing = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    const [updated] = await db
      .update(posts)
      .set({
        ...postData,
        updatedAt: new Date(),
      })
      .where(eq(posts.slug, slug))
      .returning();

    return { post: updated, created: false };
  } else {
    // Insert new
    const [created] = await db
      .insert(posts)
      .values({
        slug,
        ...postData,
      })
      .returning();

    return { post: created, created: true };
  }
}

// ============================================================================
// Optimistic Concurrency Control
// ============================================================================

/**
 * Example 12: Version-Based Updates
 * 
 * Prevent lost updates when multiple users edit the same record.
 * Requires adding version column to schema.
 */

// In schema:
// version: integer('version').notNull().default(1)

export async function updatePostWithVersionCheck(
  postId: number,
  currentVersion: number,
  updates: Partial<InsertPost>
) {
  const [updated] = await db
    .update(posts)
    .set({
      ...updates,
      // Uncomment if you add version column:
      // version: sql`${posts.version} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(posts.id, postId)
        // Uncomment when version column exists:
        // eq(posts.version, currentVersion)
      )
    )
    .returning();

  if (!updated) {
    throw new Error(
      'Update failed: Record was modified by another user. Please refresh and try again.'
    );
  }

  return updated;
}

// ============================================================================
// Audit Logging Pattern
// ============================================================================

/**
 * Example 13: Automatic Audit Trail
 * 
 * Track all changes to critical tables.
 * Requires separate audit_logs table.
 */

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export async function auditedUpdate<T>(
  updateFn: () => Promise<T>,
  metadata: {
    userId: number;
    action: AuditAction;
    tableName: string;
    recordId: number;
    changes?: Record<string, unknown>;
  }
): Promise<T> {
  return db.transaction(async (tx) => {
    // Perform the update
    const result = await updateFn();

    // Log the audit trail
    // await tx.insert(auditLogs).values({
    //   userId: metadata.userId,
    //   action: metadata.action,
    //   tableName: metadata.tableName,
    //   recordId: metadata.recordId,
    //   changes: JSON.stringify(metadata.changes),
    //   timestamp: new Date(),
    // });

    return result;
  });
}

// Usage:
// const updatedPost = await auditedUpdate(
//   () => db.update(posts).set({ title: 'New Title' }).where(eq(posts.id, 1)).returning(),
//   {
//     userId: currentUser.id,
//     action: 'UPDATE',
//     tableName: 'posts',
//     recordId: 1,
//     changes: { title: { old: 'Old Title', new: 'New Title' } },
//   }
// );

// ============================================================================
// Performance Optimization Patterns
// ============================================================================

/**
 * Example 14: Efficient Pagination with Cursor
 */
export async function getCursorPaginatedPosts(cursor?: number, limit: number = 20) {
  const conditions = cursor ? [gte(posts.id, cursor)] : [];

  const items = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(asc(posts.id))
    .limit(limit + 1); // Fetch one extra to check if there's more

  const hasMore = items.length > limit;
  const results = items.slice(0, limit);
  const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;

  return {
    items: results,
    nextCursor,
    hasMore,
  };
}

/**
 * Example 15: Batch Loading to Avoid N+1 Queries
 */
export async function getPostsWithAuthors(postIds: number[]) {
  // Single query to fetch all posts
  const postsData = await db
    .select()
    .from(posts)
    .where(sql`${posts.id} IN ${postIds}`);

  // Single query to fetch all unique authors
  const authorIds = [...new Set(postsData.map((p) => p.authorId))];
  const authorsData = await db
    .select()
    .from(users)
    .where(sql`${users.id} IN ${authorIds}`);

  // Build lookup map
  const authorsMap = new Map(authorsData.map((a) => [a.id, a]));

  // Combine data
  return postsData.map((post) => ({
    ...post,
    author: authorsMap.get(post.authorId) || null,
  }));
}

// ============================================================================
// Raw SQL for Complex Queries
// ============================================================================

/**
 * Example 16: Raw SQL When Needed
 */
export async function getPostTrendingScore() {
  // Complex calculation that's easier with raw SQL
  return db.execute(sql`
    SELECT 
      p.id,
      p.title,
      p.slug,
      (
        CAST(p.views AS FLOAT) * 1.0 +
        CAST(p.likes AS FLOAT) * 2.0 +
        CAST(p.comments AS FLOAT) * 3.0
      ) / (
        CAST((julianday('now') - julianday(p.created_at)) + 1 AS FLOAT)
      ) AS trending_score
    FROM posts p
    WHERE p.published = 1
    ORDER BY trending_score DESC
    LIMIT 10
  `);
}

// ============================================================================
// Complete Example: Service Class with Multiple Patterns
// ============================================================================

export class AdvancedPostService {
  /**
   * Create post with automatic slug generation
   */
  static async create(data: Omit<InsertPost, 'slug'>) {
    const slug = this.generateSlug(data.title);
    
    return db.transaction(async (tx) => {
      const [post] = await tx.insert(posts).values({ ...data, slug }).returning();
      return post;
    });
  }

  /**
   * Update with version check
   */
  static async update(id: number, updates: Partial<InsertPost>, currentVersion?: number) {
    return updatePostWithVersionCheck(id, currentVersion || 1, updates);
  }

  /**
   * Soft delete
   */
  static async delete(id: number, userId: number) {
    return softDeletePost(id, userId);
  }

  /**
   * Find with complex filters
   */
  static async findMany(filters: Parameters<typeof findPostsAdvanced>[0]) {
    return findPostsAdvanced(filters);
  }

  /**
   * Get statistics
   */
  static async getStats() {
    return getPostStatsByAuthor();
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// Usage:
// const post = await AdvancedPostService.create({
//   title: 'My New Post',
//   content: 'Content here',
//   authorId: 1,
// });
