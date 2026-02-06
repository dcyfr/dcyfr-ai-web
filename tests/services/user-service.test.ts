import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, resetTestDb } from '../helpers';
import { UserService } from '@/services/user-service';
import type { DbInstance } from '@/db/connection';

describe('UserService', () => {
  let dbInstance: DbInstance;
  let service: UserService;

  beforeEach(() => {
    dbInstance = getTestDb();
    service = new UserService(dbInstance.orm);
  });

  it('creates a user', async () => {
    const user = await service.create({
      email: 'test@test.com',
      name: 'Test User',
      password: 'password123',
    });
    expect(user.email).toBe('test@test.com');
    expect(user.name).toBe('Test User');
    expect(user.role).toBe('user');
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('finds user by id', async () => {
    const created = await service.create({
      email: 'test@test.com',
      name: 'Test',
      password: 'password123',
    });
    const found = await service.findById(created.id);
    expect(found.email).toBe('test@test.com');
  });

  it('throws NotFoundError for missing user', async () => {
    await expect(service.findById(999)).rejects.toThrow('not found');
  });

  it('finds user by email (includes passwordHash)', async () => {
    await service.create({
      email: 'test@test.com',
      name: 'Test',
      password: 'password123',
    });
    const found = await service.findByEmail('test@test.com');
    expect(found).toBeDefined();
    expect(found!.passwordHash).toBeDefined();
  });

  it('returns undefined for missing email', async () => {
    const found = await service.findByEmail('missing@test.com');
    expect(found).toBeUndefined();
  });

  it('lists all users', async () => {
    await service.create({ email: 'a@test.com', name: 'A', password: 'password123' });
    await service.create({ email: 'b@test.com', name: 'B', password: 'password123' });
    const all = await service.findAll();
    expect(all).toHaveLength(2);
  });

  it('rejects duplicate email', async () => {
    await service.create({ email: 'dup@test.com', name: 'First', password: 'password123' });
    await expect(
      service.create({ email: 'dup@test.com', name: 'Second', password: 'password123' }),
    ).rejects.toThrow('already registered');
  });

  it('updates a user', async () => {
    const created = await service.create({
      email: 'test@test.com',
      name: 'Old Name',
      password: 'password123',
    });
    const updated = await service.update(created.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
  });

  it('deletes a user', async () => {
    const created = await service.create({
      email: 'test@test.com',
      name: 'Test',
      password: 'password123',
    });
    await service.delete(created.id);
    await expect(service.findById(created.id)).rejects.toThrow('not found');
  });
});
