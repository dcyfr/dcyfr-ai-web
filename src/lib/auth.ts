import { sign, verify, type SignOptions } from 'jsonwebtoken';
import { hashSync, compareSync } from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export function hashPassword(password: string): string {
  return hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

export function generateToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return verify(token, JWT_SECRET) as JwtPayload;
}
