import { query } from '@solidjs/router';

import type { RouteSchema, SharedApiRoute } from '@repo/shared';

import { apiFetch, type CallOptions } from '../fetch';
import { useI18n } from '../i18n';

export { apiFetch, ApiError } from '../fetch';
export type { CallOptions, RouteResponse } from '../fetch';

// For GET requests — cache-based, preload-compatible.
// Call at module level in route files; use with createAsync in components.
export const createApiCall = <S extends RouteSchema>(route: SharedApiRoute<S>) =>
  query(
    (options?: Omit<CallOptions<S>, 'signal'>) => apiFetch(route, undefined, options as CallOptions<S>),
    `api:${route.method}:${route.url}`
  );

// For mutations (POST/PUT/DELETE) — reads locale from i18n context, not cached.
// Call inside a component; the returned function is used in event handlers.
export const createMutation = <S extends RouteSchema>(route: SharedApiRoute<S>) => {
  const { locale } = useI18n();
  return (options?: CallOptions<S>) => apiFetch(route, locale(), options);
};
