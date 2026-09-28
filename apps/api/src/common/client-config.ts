import type { ClientConfig } from '@repo/shared';
import { clientConfigDefaults, resolveClientConfig } from '@repo/shared/node';
import type { FastifyBaseLogger } from 'fastify';

import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';

export interface ClientConfigSource {
  current: () => ClientConfig;
  close: () => void;
}

/**
 * Reloads the config whenever the file changes, keeping the last known-good value if the new
 * one is unreadable or invalid. A missing file is a warning, not a boot failure.
 */
export const createClientConfigSource = async (path: string, log: FastifyBaseLogger): Promise<ClientConfigSource> => {
  const absolute = resolve(path);
  let current = clientConfigDefaults();

  const load = async (): Promise<void> => {
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(absolute, 'utf8'));
    } catch (error) {
      log.error({ err: error, path: absolute }, 'client-config: unreadable, keeping previous config');
      return;
    }

    const result = resolveClientConfig(raw);
    if (!result.ok) {
      log.error({ path: absolute, errors: result.errors }, 'client-config: invalid, keeping previous config');
      return;
    }

    current = result.config;
    log.info({ path: absolute, config: current }, 'client-config: loaded');
  };

  await load();

  // Watch the directory, not the file: a save-via-rename replaces the inode and a file watcher
  // would go deaf. One save can emit several events, hence the debounce.
  let timer: NodeJS.Timeout | undefined;
  const watcher = watch(dirname(absolute), (_event, filename) => {
    if (filename !== basename(absolute)) return;
    clearTimeout(timer);
    timer = setTimeout(() => void load(), 50);
  });
  watcher.on('error', (error) => {
    log.error({ err: error, path: absolute }, 'client-config: watch failed, config is now static');
  });

  return {
    current: () => current,
    close: () => {
      clearTimeout(timer);
      watcher.close();
    },
  };
};
