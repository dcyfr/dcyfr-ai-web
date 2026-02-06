import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '@/lib/auth';

describe('Auth Utils', () => {
  describe('password hashing', () => {
    it('hashes and verifies a password', () => {
      const hash = hashPassword('mypassword');
      expect(hash).not.toBe('mypassword');
      expect(verifyPassword('mypassword', hash)).toBe(true);
    });

    it('rejects wrong password', () => {
      const hash = hashPassword('mypassword');
      expect(verifyPassword('wrongpassword', hash)).toBe(false);
    });

    it('produces different hashes for same password', () => {
      const hash1 = hashPassword('mypassword');
      const hash2 = hashPassword('mypassword');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('JWT tokens', () => {
    it('generates and verifies a token', () => {
      const payload = { userId: 1, email: 'test@test.com', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('test@test.com');
      expect(decoded.role).toBe('user');
    });

    it('throws on invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });
  });
});
