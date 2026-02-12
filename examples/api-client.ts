/**
 * API Client Example - Type-Safe API Calls with Authentication
 * 
 * This example demonstrates how to interact with the API routes
 * using type-safe client-side code with proper authentication.
 * 
 * Usage:
 *   - Can be imported into client components
 *   - Automatically handles JWT tokens from cookies
 *   - Type-safe with Zod validation
 *   - Includes error handling patterns
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['user', 'admin']),
});

const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(),
  published: z.boolean(),
  authorId: z.number(),
  createdAt: z.string().transform((val) => new Date(val)),
  updatedAt: z.string().transform((val) => new Date(val)),
});

const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type User = z.infer<typeof userSchema>;
export type Post = z.infer<typeof postSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

// ============================================================================
// API Error Class
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ============================================================================
// Base API Client
// ============================================================================

class BaseAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  }

  /**
   * Make authenticated HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Request failed',
      }));

      throw new APIError(
        error.error || 'Request failed',
        response.status,
        error.code,
        error.details
      );
    }

    return response.json();
  }

  protected get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  protected post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ============================================================================
// Authentication API
// ============================================================================

export class AuthAPI extends BaseAPIClient {
  /**
   * Register new user
   */
  async register(data: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ user: User }> {
    const response = await this.post<{ user: unknown }>('/api/auth/register', data);
    return {
      user: userSchema.parse(response.user),
    };
  }

  /**
   * Login user
   */
  async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: User }> {
    const response = await this.post<{ user: unknown }>('/api/auth/login', data);
    return {
      user: userSchema.parse(response.user),
    };
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean }> {
    return this.post('/api/auth/logout');
  }
}

// ============================================================================
// Posts API
// ============================================================================

export class PostsAPI extends BaseAPIClient {
  /**
   * Get all posts with pagination
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    published?: boolean;
    search?: string;
  }): Promise<{ items: Post[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.published !== undefined)
      searchParams.set('published', params.published.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const endpoint = `/api/posts${query ? `?${query}` : ''}`;

    const response = await this.get<{
      items: unknown[];
      pagination: unknown;
    }>(endpoint);

    return {
      items: z.array(postSchema).parse(response.items),
      pagination: paginationSchema.parse(response.pagination),
    };
  }

  /**
   * Get single post by ID
   */
  async getById(id: number): Promise<Post> {
    const response = await this.get<unknown>(`/api/posts/${id}`);
    return postSchema.parse(response);
  }

  /**
   * Get single post by slug
   */
  async getBySlug(slug: string): Promise<Post> {
    const response = await this.get<unknown>(`/api/posts/slug/${slug}`);
    return postSchema.parse(response);
  }

  /**
   * Create new post (requires authentication)
   */
  async create(data: {
    title: string;
    content: string;
    excerpt?: string;
    published?: boolean;
  }): Promise<Post> {
    const response = await this.post<unknown>('/api/posts', data);
    return postSchema.parse(response);
  }

  /**
   * Update post (requires authentication)
   */
  async update(
    id: number,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      published?: boolean;
    }
  ): Promise<Post> {
    const response = await this.patch<unknown>(`/api/posts/${id}`, data);
    return postSchema.parse(response);
  }

  /**
   * Delete post (requires authentication)
   */
  async deletePost(id: number): Promise<{ success: boolean }> {
    return super.delete(`/api/posts/${id}`);
  }
}

// ============================================================================
// Unified API Client
// ============================================================================

export class APIClient {
  public auth: AuthAPI;
  public posts: PostsAPI;

  constructor(baseUrl?: string) {
    this.auth = new AuthAPI(baseUrl);
    this.posts = new PostsAPI(baseUrl);
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Authentication Flow
 */
export async function exampleAuthFlow() {
  const api = new APIClient();

  try {
    // Register new user
    const { user } = await api.auth.register({
      email: 'john@example.com',
      name: 'John Doe',
      password: 'SecurePassword123!',
    });

    console.log('Registered user:', user);

    // Login
    const { user: loggedInUser } = await api.auth.login({
      email: 'john@example.com',
      password: 'SecurePassword123!',
    });

    console.log('Logged in:', loggedInUser);

    // Logout
    await api.auth.logout();
    console.log('Logged out successfully');
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`API Error [${error.status}]:`, error.message);
      if (error.details) {
        console.error('Details:', error.details);
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example 2: CRUD Operations on Posts
 */
export async function examplePostsCRUD() {
  const api = new APIClient();

  try {
    // Create post (requires authentication)
    const newPost = await api.posts.create({
      title: 'Getting Started with Next.js 14',
      content: 'Next.js 14 introduces powerful new features...',
      excerpt: 'Learn the basics of Next.js 14',
      published: true,
    });

    console.log('Created post:', newPost);

    // Get all published posts
    const { items, pagination } = await api.posts.getAll({
      page: 1,
      limit: 10,
      published: true,
    });

    console.log(`Found ${items.length} posts`);
    console.log('Pagination:', pagination);

    // Get single post by ID
    const post = await api.posts.getById(newPost.id);
    console.log('Post by ID:', post);

    // Update post
    const updated = await api.posts.update(newPost.id, {
      title: 'Getting Started with Next.js 14 (Updated)',
      published: false,
    });

    console.log('Updated post:', updated);

    // Delete post
    await api.posts.deletePost(newPost.id);
    console.log('Post deleted');
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`API Error [${error.status}]:`, error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example 3: Paginated Posts with Search
 */
export async function examplePaginatedSearch() {
  const api = new APIClient();

  try {
    // Search for posts containing "Next.js"
    const page1 = await api.posts.getAll({
      page: 1,
      limit: 5,
      search: 'Next.js',
      published: true,
    });

    console.log(`Page 1: ${page1.items.length} posts`);

    // Load next page if available
    if (page1.pagination.hasNext) {
      const page2 = await api.posts.getAll({
        page: page1.pagination.page + 1,
        limit: 5,
        search: 'Next.js',
        published: true,
      });

      console.log(`Page 2: ${page2.items.length} posts`);
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`API Error [${error.status}]:`, error.message);
    }
  }
}

/**
 * Example 4: Error Handling Patterns
 */
export async function exampleErrorHandling() {
  const api = new APIClient();

  // Handle validation errors
  try {
    await api.posts.create({
      title: 'x', // Too short
      content: 'y', // Too short
    });
  } catch (error) {
    if (error instanceof APIError && error.status === 400) {
      console.error('Validation failed:', error.details);
      // Display validation errors to user
    }
  }

  // Handle authentication errors
  try {
    await api.posts.create({
      title: 'Unauthorized Post',
      content: 'This will fail if not authenticated',
    });
  } catch (error) {
    if (error instanceof APIError && error.status === 401) {
      console.error('Please login first');
      // Redirect to login page
    }
  }

  // Handle not found errors
  try {
    await api.posts.getById(999999);
  } catch (error) {
    if (error instanceof APIError && error.status === 404) {
      console.error('Post not found');
      // Show 404 page or message
    }
  }
}

/**
 * Example 5: React Hook Integration
 */
export function useAPI() {
  const api = new APIClient();

  return {
    auth: api.auth,
    posts: api.posts,
  };
}

// Usage in React component:
// const { posts } = useAPI();
// const { items } = await posts.getAll({ page: 1, limit: 10 });
