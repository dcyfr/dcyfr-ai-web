import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb } from '../helpers';
import { PostService } from '@/services/post-service';
import { UserService } from '@/services/user-service';
import type { DbInstance } from '@/db/connection';

describe('PostService', () => {
  let dbInstance: DbInstance;
  let postService: PostService;
  let userService: UserService;
  let userId: number;

  beforeEach(async () => {
    dbInstance = getTestDb();
    postService = new PostService(dbInstance.orm);
    userService = new UserService(dbInstance.orm);
    const user = await userService.create({
      email: 'author@test.com',
      name: 'Author',
      password: 'password123',
    });
    userId = user.id;
  });

  it('creates a post with slug', async () => {
    const post = await postService.create({
      title: 'Hello World',
      content: 'My first post',
      authorId: userId,
    });
    expect(post.title).toBe('Hello World');
    expect(post.slug).toBe('hello-world');
    expect(post.published).toBe(false);
  });

  it('finds post by id', async () => {
    const created = await postService.create({
      title: 'Test Post',
      content: 'Content',
      authorId: userId,
    });
    const found = await postService.findById(created.id);
    expect(found.title).toBe('Test Post');
  });

  it('throws NotFoundError for missing post', async () => {
    await expect(postService.findById(999)).rejects.toThrow('not found');
  });

  it('finds post by slug', async () => {
    await postService.create({
      title: 'Slug Test',
      content: 'Content',
      authorId: userId,
    });
    const found = await postService.findBySlug('slug-test');
    expect(found.title).toBe('Slug Test');
  });

  it('finds published posts only', async () => {
    await postService.create({ title: 'Published', content: 'C', published: true, authorId: userId });
    await postService.create({ title: 'Draft', content: 'C', published: false, authorId: userId });
    const published = await postService.findPublished();
    expect(published).toHaveLength(1);
    expect(published[0].title).toBe('Published');
  });

  it('finds posts by author', async () => {
    await postService.create({ title: 'Post 1', content: 'C', authorId: userId });
    await postService.create({ title: 'Post 2', content: 'C', authorId: userId });
    const posts = await postService.findByAuthor(userId);
    expect(posts).toHaveLength(2);
  });

  it('updates post by owner', async () => {
    const post = await postService.create({
      title: 'Original',
      content: 'Content',
      authorId: userId,
    });
    const updated = await postService.update(post.id, userId, { title: 'Updated' });
    expect(updated.title).toBe('Updated');
    expect(updated.slug).toBe('updated');
  });

  it('rejects update by non-owner', async () => {
    const post = await postService.create({
      title: 'My Post',
      content: 'Content',
      authorId: userId,
    });
    await expect(postService.update(post.id, 999, { title: 'Hack' })).rejects.toThrow(
      'Not the post owner',
    );
  });

  it('deletes post by owner', async () => {
    const post = await postService.create({
      title: 'Delete Me',
      content: 'Content',
      authorId: userId,
    });
    await postService.delete(post.id, userId);
    await expect(postService.findById(post.id)).rejects.toThrow('not found');
  });

  it('rejects delete by non-owner', async () => {
    const post = await postService.create({
      title: 'My Post',
      content: 'Content',
      authorId: userId,
    });
    await expect(postService.delete(post.id, 999)).rejects.toThrow('Not the post owner');
  });
});
