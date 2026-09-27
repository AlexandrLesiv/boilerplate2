import { openDB, type DBSchema } from 'idb';

import type { LogEntry, LogLevel } from './types';

interface LogDB extends DBSchema {
  entries: {
    key: number;
    value: LogEntry;
    indexes: { timestamp: number; level: LogLevel };
  };
}

const RETENTION_MS = import.meta.env.DEV
  ? 24 * 60 * 60 * 1_000        // 24 h in dev
  : 7 * 24 * 60 * 60 * 1_000;  // 7 days in prod

const db = openDB<LogDB>('app-logs', 1, {
  upgrade(database) {
    const store = database.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
    store.createIndex('timestamp', 'timestamp');
    store.createIndex('level', 'level');
  },
});

export async function dbAppend(entries: Omit<LogEntry, 'id'>[]): Promise<void> {
  if (!entries.length) return;
  const tx = (await db).transaction('entries', 'readwrite');
  await Promise.all([...entries.map((e) => tx.store.add(e as LogEntry)), tx.done]);
}

export async function dbRead(opts?: { limit?: number; since?: number }): Promise<LogEntry[]> {
  let result = await (await db).getAll('entries');
  if (opts?.since != null) result = result.filter((e) => e.timestamp >= opts.since!);
  if (opts?.limit != null) result = result.slice(-opts.limit);
  return result;
}

export async function dbClear(): Promise<void> {
  await (await db).clear('entries');
}

// Delete entries older than RETENTION_MS. Called once on logger init.
export async function dbTrim(): Promise<void> {
  const cutoff = Date.now() - RETENTION_MS;
  const database = await db;
  const tx = database.transaction('entries', 'readwrite');
  // IDBKeyRange.upperBound(cutoff) selects all timestamps ≤ cutoff
  let cursor = await tx.store.index('timestamp').openCursor(IDBKeyRange.upperBound(cutoff));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
