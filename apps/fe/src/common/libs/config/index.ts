import { createContext, createEffect, useContext } from 'solid-js';

import { createAsync } from '@solidjs/router';

import { clientConfigRoute, type ClientConfig, type FeatureFlag } from '@repo/shared';

import { createApiCall } from '../api';
import { logger } from '../logger';

/** Baked in and validated by `vite-plugins/define-client-configuration.ts`. */
export const CLIENT_CONFIG_DEFAULTS: ClientConfig = __CLIENT_CONFIG_DEFAULTS__;

const getClientConfig = createApiCall(clientConfigRoute);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Type-checks against the defaults because TypeBox is stripped from the client bundle, so the
// real schema is unavailable here. Keeps a server ahead of or behind this build safe.
const overlay = (defaults: unknown, incoming: unknown, path: string): unknown => {
  if (!isRecord(defaults) || !isRecord(incoming)) return defaults;

  const result: Record<string, unknown> = { ...defaults };
  for (const [key, fallback] of Object.entries(defaults)) {
    if (!(key in incoming)) continue;
    const value = incoming[key];
    const keyPath = path ? `${path}.${key}` : key;

    if (isRecord(fallback)) {
      result[key] = overlay(fallback, value, keyPath);
    } else if (typeof value === typeof fallback) {
      result[key] = value;
    } else {
      logger.warn('config.value.rejected', {
        key: keyPath,
        expected: typeof fallback,
        received: typeof value,
      });
    }
  }
  return result;
};

export const mergeClientConfig = (incoming: unknown): ClientConfig =>
  overlay(CLIENT_CONFIG_DEFAULTS, incoming, '') as ClientConfig;

/** Fetched once per page load; under SSR the result is serialised into the HTML payload. */
export const createConfigStore = () => {
  // initialValue makes the accessor non-optional, so there is always a complete config.
  const config = createAsync(
    async () => {
      try {
        const response = await getClientConfig();
        return mergeClientConfig(response.data);
      } catch (error) {
        logger.warn('config.load.failed', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        return CLIENT_CONFIG_DEFAULTS;
      }
    },
    { initialValue: CLIENT_CONFIG_DEFAULTS }
  );

  // An effect, not a log inside the fetcher: the fetcher only runs server-side on an SSR load,
  // so the browser's IDB history would never record the config it ran with.
  createEffect(() => {
    logger.info('config.resolved', { ...config() });
  });

  return { config };
};

export type ConfigStore = ReturnType<typeof createConfigStore>;

export const ConfigContext = createContext<ConfigStore>();

export const useConfig = (): ConfigStore => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigContext.Provider');
  return ctx;
};

/** Per-flag accessor. Call it inside a tracking scope or it will not update. */
export const useFeature = (flag: FeatureFlag) => {
  const { config } = useConfig();
  return () => config().features[flag];
};
