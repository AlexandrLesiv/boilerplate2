import { query } from '@solidjs/router';

import type { RouteSchema, SharedApiRoute } from '@repo/shared';

import { ApiError, apiFetch, type CallOptions, type RouteResponse } from '../fetch';
import { useI18n } from '../i18n';

export { apiFetch, ApiError } from '../fetch';
export type { CallOptions, RouteResponse } from '../fetch';

/** The `query` cache key for a route. Exported so callers can `revalidate()` it. */
export const apiQueryKey = <S extends RouteSchema>(route: SharedApiRoute<S>) => `api:${route.method}:${route.url}`;

// For GET requests — cache-based, preload-compatible.
// Call at module level in route files; use with createAsync in components.
export const createApiCall = <S extends RouteSchema>(route: SharedApiRoute<S>) =>
  query(
    (options?: Omit<CallOptions<S>, 'signal'>) => apiFetch(route, undefined, options as CallOptions<S>),
    apiQueryKey(route)
  );

/**
 * A request outcome as data. On failure, `status` is `null` when the request never got a response,
 * and `payload` is whatever body the server sent with it. `offline` is only meaningful alongside a
 * `null` status — see `createSafeApiCall`'s catch for why it's resolved there and not later.
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number | null; payload?: unknown; offline?: boolean };

/**
 * GET that reports an expected failure as a resolved `ApiResult` rather than throwing.
 *
 * This is the point: a rejection that crosses the SSR boundary gets serialised into the hydration
 * payload and replayed in the browser, where nothing can catch it — so the browser reports it even
 * though we handled it. Resolving instead means there is no rejection to report, in dev or prod.
 * Genuinely unexpected errors still throw, so a `DataBoundary` still surfaces them.
 */
export const createSafeApiCall = <S extends RouteSchema>(route: SharedApiRoute<S>) =>
  query(async (options?: Omit<CallOptions<S>, 'signal'>): Promise<ApiResult<RouteResponse<S>>> => {
    try {
      return { ok: true, data: await apiFetch(route, undefined, options as CallOptions<S>) };
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, status: error.status, payload: error.payload };
      if (error instanceof TypeError) {
        // Resolved here, once, at the moment this specific attempt failed — not by the component
        // that renders the result. That render also runs during client hydration of this same SSR
        // failure, where `import.meta.env.SSR`/`navigator.onLine` would disagree with the server's
        // answer for identical data, and hydration never repaints to reconcile that disagreement.
        return { ok: false, status: null, offline: import.meta.env.SSR ? undefined : !navigator.onLine };
      }
      throw error;
    }
  }, apiQueryKey(route));

// For mutations (POST/PUT/DELETE) — reads locale from i18n context, not cached.
// Call inside a component; the returned function is used in event handlers.
export const createMutation = <S extends RouteSchema>(route: SharedApiRoute<S>) => {
  const { locale } = useI18n();
  return (options?: CallOptions<S>) => apiFetch(route, locale(), options);
};
