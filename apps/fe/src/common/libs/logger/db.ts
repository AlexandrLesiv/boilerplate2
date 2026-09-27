import type { DBSchema } from 'idb';

import { createIdbStore } from '../idb';
import type { LogEntry, LogLevel } from './types';

interface LogDB extends DBSchema {
  entries: {
    key: number;
    value: LogEntry;
    indexes: { timestamp: string; level: LogLevel };
  };
}

const RETENTION_MS = import.meta.env.DEV ? 24 * 60 * 60 * 1_000 : 7 * 24 * 60 * 60 * 1_000;

const IDB_STORE_VERSION = 2;

const getDb = createIdbStore<LogDB>('app-logs', IDB_STORE_VERSION, (db, oldVersion) => {
  if (oldVersion < 2 && db.objectStoreNames.contains('entries')) {
    db.deleteObjectStore('entries');
  }
  const store = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
  store.createIndex('timestamp', 'timestamp');
  store.createIndex('level', 'level');
});

export const dbAppend = async (entries: Omit<LogEntry, 'id'>[]): Promise<void> => {
  const db = getDb();
  if (!db || !entries.length) return;
  const tx = (await db).transaction('entries', 'readwrite');
  await Promise.all([...entries.map((e) => tx.store.add(e as LogEntry)), tx.done]);
};

export const dbRead = async (opts?: { limit?: number; since?: number }): Promise<LogEntry[]> => {
  const db = getDb();
  if (!db) return [];
  let result = await (await db).getAll('entries');
  if (opts?.since != null) {
    const sinceIso = new Date(opts.since).toISOString();
    result = result.filter((e) => e.timestamp >= sinceIso);
  }
  if (opts?.limit != null) result = result.slice(-opts.limit);
  return result;
};

export const dbClear = async (): Promise<void> => {
  const db = getDb();
  if (!db) return;
  await (await db).clear('entries');
};

export const dbTrim = async (): Promise<void> => {
  const db = getDb();
  if (!db) return;
  const cutoff = new Date(Date.now() - RETENTION_MS).toISOString();
  const database = await db;
  const tx = database.transaction('entries', 'readwrite');
  let cursor = await tx.store.index('timestamp').openCursor(IDBKeyRange.upperBound(cutoff));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
};
