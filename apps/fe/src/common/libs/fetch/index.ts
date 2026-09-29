import type { RouteSchema, SharedApiRoute } from '@repo/shared';
import { type Static, type TSchema } from '@sinclair/typebox';

import { apiBaseUrl } from '@/common/constants/environment';

import { logger } from '../logger';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Body the server sent with the failure: parsed JSON, raw text, or undefined if empty. */
    readonly payload?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Never throws — a failure response with an unreadable body still has to produce an ApiError. */
const readErrorPayload = async (response: Response): Promise<unknown> => {
  try {
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
};

export type CallOptions<S extends RouteSchema> = (S['querystring'] extends TSchema
  ? { querystring?: Static<S['querystring']> }
  : { querystring?: never }) &
  (S['body'] extends TSchema ? { body: Static<S['body']> } : { body?: never }) &
  (S['params'] extends TSchema ? { params: Static<S['params']> } : { params?: never }) & {
    signal?: AbortSignal;
  };

export type RouteResponse<S extends RouteSchema> = S['response'] extends { 200: TSchema }
  ? Static<S['response'][200]>
  : unknown;

/** Route params/querystring values are primitives in practice; objects fall back to JSON rather than `[object Object]`. */
const toUrlValue = (value: unknown): string =>
  typeof value === 'object' && value !== null
    ? JSON.stringify(value)
    : String((value as string | number | boolean | undefined) ?? '');

export const buildRouteUrl = (
  url: string,
  params?: Record<string, unknown>,
  querystring?: Record<string, unknown>
): string => {
  const path = params ? url.replace(/:([^/]+)/g, (_, key: string) => encodeURIComponent(toUrlValue(params[key]))) : url;
  const full = new URL(`${apiBaseUrl}${path}`);
  if (querystring) {
    for (const [key, value] of Object.entries(querystring)) {
      if (value !== undefined && value !== null) full.searchParams.set(key, toUrlValue(value));
    }
  }
  return full.toString();
};

/**
 * Dev-only schema check. Purely observational: no `Convert`, `Default` or `Clean`, so the payload
 * the app receives is exactly what production would receive and a divergence surfaces as a log
 * rather than as a value the schema quietly repaired.
 *
 * The check lives in a separate module imported dynamically behind an inline
 * `import.meta.env.DEV`, which is what lets the production build drop it — there
 * `strip-typebox.ts` replaces TypeBox with a stub that has no `Value`.
 */
const reportSchemaDivergence = async <S extends RouteSchema>(
  route: SharedApiRoute<S>,
  status: number,
  payload: unknown,
  url: string
): Promise<void> => {
  const schema = route.schema.response?.[status];
  if (!schema) return;

  const { checkResponse } = await import('./validate-response');
  const errors = checkResponse(schema, payload);
  if (errors.length === 0) return;

  logger.error('api.response.invalid', { method: route.method, url, status, errors });
};

export const apiFetch = async <S extends RouteSchema>(
  route: SharedApiRoute<S>,
  locale?: string,
  options?: CallOptions<S>
): Promise<RouteResponse<S>> => {
  const url = buildRouteUrl(
    route.url,
    options?.params as Record<string, unknown> | undefined,
    options?.querystring as Record<string, unknown> | undefined
  );
  const hasBody = (options as { body?: unknown } | undefined)?.body !== undefined;
  const headers: Record<string, string> = {};
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (locale) headers['Accept-Language'] = locale;

  const t0 = performance.now();
  const response = await fetch(url, {
    method: route.method,
    headers,
    body: hasBody ? JSON.stringify((options as { body: unknown }).body) : undefined,
    signal: options?.signal,
  });
  const durationMs = performance.now() - t0;
  if (!response.ok) {
    const payload = await readErrorPayload(response);
    logger.apiError(route.method, url, response.status, response.statusText);
    throw new ApiError(response.status, `Request failed: ${response.status} ${response.statusText}`, payload);
  }
  logger.perf(`api.${route.method.toLowerCase()}.${url}`, durationMs);

  const payload = (await response.json()) as RouteResponse<S>;
  // Not awaited: loading TypeBox is slow enough on first use to delay the render if it sits on
  // the response path, and a diagnostic must not change how fast the app gets its data.
  if (import.meta.env.DEV) void reportSchemaDivergence(route, response.status, payload, url);
  return payload;
};
