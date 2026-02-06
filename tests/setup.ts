import '@testing-library/jest-dom/vitest';
import { afterAll } from 'vitest';
import { unlinkSync, existsSync } from 'fs';

afterAll(() => {
  // Clean up any test databases
  const testDbs = ['./data/test.db', './data/test.db-journal', './data/test.db-wal', './data/test.db-shm'];
  for (const db of testDbs) {
    if (existsSync(db)) {
      try {
        unlinkSync(db);
      } catch {
        // ignore
      }
    }
  }
});
