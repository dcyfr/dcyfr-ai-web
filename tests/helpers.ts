import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import { migrate } from '@/db/migrate';
import type { AppDb, DbInstance } from '@/db/connection';

export function getTestDb(): DbInstance {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  migrate(sqlite);
  const orm = drizzle(sqlite, { schema });
  return { orm, sqlite };
}

export function resetTestDb(instance: DbInstance): void {
  instance.sqlite.exec('DELETE FROM posts');
  instance.sqlite.exec('DELETE FROM users');
}
