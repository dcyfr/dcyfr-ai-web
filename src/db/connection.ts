import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export type AppDb = BetterSQLite3Database<typeof schema>;

export interface DbInstance {
  orm: AppDb;
  sqlite: Database.Database;
}

function ensureDataDir(dbPath: string): void {
  const dir = dirname(dbPath);
  if (dir !== '.' && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function createDb(url?: string): DbInstance {
  const dbUrl = url || process.env.DATABASE_URL || './data/dev.db';

  if (dbUrl !== ':memory:') {
    ensureDataDir(dbUrl);
  }

  const sqlite = new Database(dbUrl);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const orm = drizzle(sqlite, { schema });

  return { orm, sqlite };
}

const defaultInstance = createDb();
export const db: AppDb = defaultInstance.orm;
export const sqliteDb: Database.Database = defaultInstance.sqlite;
