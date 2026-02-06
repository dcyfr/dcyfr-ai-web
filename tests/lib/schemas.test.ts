import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createPostSchema,
  updatePostSchema,
  updateUserSchema,
} from '@/lib/schemas';

describe('Schemas', () => {
  describe('registerSchema', () => {
    it('validates valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'test@test.com',
        name: 'Test User',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        name: 'Test',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = registerSchema.safeParse({
        email: 'test@test.com',
        name: 'Test',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
      const result = registerSchema.safeParse({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing password', () => {
      const result = loginSchema.safeParse({
        email: 'test@test.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createPostSchema', () => {
    it('validates valid post data', () => {
      const result = createPostSchema.safeParse({
        title: 'My Post',
        content: 'Post content here',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.published).toBe(false);
      }
    });

    it('validates with all optional fields', () => {
      const result = createPostSchema.safeParse({
        title: 'My Post',
        content: 'Content',
        excerpt: 'Summary',
        published: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing title', () => {
      const result = createPostSchema.safeParse({
        content: 'Content',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updatePostSchema', () => {
    it('allows partial updates', () => {
      const result = updatePostSchema.safeParse({ title: 'New Title' });
      expect(result.success).toBe(true);
    });

    it('allows empty object', () => {
      const result = updatePostSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('updateUserSchema', () => {
    it('validates optional name update', () => {
      const result = updateUserSchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('validates optional email update', () => {
      const result = updateUserSchema.safeParse({ email: 'new@test.com' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = updateUserSchema.safeParse({ email: 'not-valid' });
      expect(result.success).toBe(false);
    });
  });
});
