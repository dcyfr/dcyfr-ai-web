import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '@/lib/errors';

describe('Error Classes', () => {
  it('creates AppError with statusCode and message', () => {
    const err = new AppError(500, 'Server error', 'INTERNAL');
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('Server error');
    expect(err.code).toBe('INTERNAL');
    expect(err).toBeInstanceOf(Error);
  });

  it('creates NotFoundError with resource name', () => {
    const err = new NotFoundError('User', 123);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('User with id 123 not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('creates NotFoundError without id', () => {
    const err = new NotFoundError('Post');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Post not found');
  });

  it('creates ValidationError with details', () => {
    const err = new ValidationError('Invalid input', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ field: 'email' });
  });

  it('creates UnauthorizedError with default message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Authentication required');
  });

  it('creates ForbiddenError with default message', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Insufficient permissions');
  });

  it('creates ConflictError', () => {
    const err = new ConflictError('Email already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });
});
