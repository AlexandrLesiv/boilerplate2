import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * Returns a lazy getter for a typed IDB database.
 * The database is opened on first call and only in browser environments.
 * Safe to call during SSR — returns null on the server.
 */
export const createIdbStore = <T extends DBSchema>(
  name: string,
  version: number,
  onUpgrade: (db: IDBPDatabase<T>) => void,
) => {
  let promise: ReturnType<typeof openDB<T>> | null = null;

  return (): ReturnType<typeof openDB<T>> | null => {
    if (import.meta.env.SSR) return null;
    if (!promise) {
      promise = openDB<T>(name, version, { upgrade: onUpgrade });
    }
    return promise;
  };
};
