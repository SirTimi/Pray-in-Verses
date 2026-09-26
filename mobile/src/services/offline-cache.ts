import * as SQLite from 'expo-sqlite';

import { ApiError } from './api';

const DATABASE_NAME = 'prayinverses-offline.db';

type CacheRow = {
  payload: string;
  updated_at: number;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS public_cache (
          cache_key TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

      return db;
    })();
  }

  return databasePromise;
}

export async function readPublicCache<T>(key: string): Promise<T | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CacheRow>(
    'SELECT payload, updated_at FROM public_cache WHERE cache_key = ?',
    [key],
  );

  if (!row) return null;

  try {
    return JSON.parse(row.payload) as T;
  } catch {
    await db.runAsync(
      'DELETE FROM public_cache WHERE cache_key = ?',
      [key],
    );
    return null;
  }
}

export async function writePublicCache<T>(key: string, value: T) {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO public_cache (cache_key, payload, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
    [key, JSON.stringify(value), Date.now()],
  );
}

function mayUseOfflineFallback(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  return error.status >= 500;
}

export async function networkFirstWithPublicCache<T>(
  key: string,
  request: () => Promise<T>,
  options?: {
    cacheValue?: (value: T) => T;
    fallback?: () => T | Promise<T>;
  },
): Promise<T> {
  try {
    const value = await request();
    const cacheValue = options?.cacheValue
      ? options.cacheValue(value)
      : value;

    try {
      await writePublicCache(key, cacheValue);
    } catch {
      // Cache failures must never break a successful online read.
    }

    return value;
  } catch (error) {
    if (!mayUseOfflineFallback(error)) {
      throw error;
    }

    try {
      const cached = await readPublicCache<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch {
      // Preserve the original network/server error if local storage fails too.
    }

    if (options?.fallback) {
      try {
        return await options.fallback();
      } catch {
        // Preserve the original network/server error if bundled content fails too.
      }
    }

    throw error;
  }
}
