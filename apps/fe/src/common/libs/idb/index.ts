import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export const createIdbStore = <T extends DBSchema>(
  name: string,
  version: number,
  onUpgrade: (db: IDBPDatabase<T>, oldVersion: number) => void,
) => {
  let promise: ReturnType<typeof openDB<T>> | null = null;
  return (): ReturnType<typeof openDB<T>> | null => {
    if (import.meta.env.SSR) return null;
    if (!promise)
      promise = openDB<T>(name, version, {
        upgrade: (db, oldVersion) => onUpgrade(db, oldVersion),
      });
    return promise;
  };
};
