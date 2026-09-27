import type { RouteSchema, SharedApiRoute } from '@repo/shared';
import { type Static, type TSchema } from '@sinclair/typebox';

import { apiBaseUrl } from '../../constants/environment';
import { logger } from '../logger';

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export type CallOptions<S extends RouteSchema> =
  (S['querystring'] extends TSchema ? { querystring?: Static<S['querystring']> } : { querystring?: never }) &
  (S['body'] extends TSchema ? { body: Static<S['body']> } : { body?: never }) &
  (S['params'] extends TSchema ? { params: Static<S['params']> } : { params?: never }) & {
    signal?: AbortSignal;
  };

export type RouteResponse<S extends RouteSchema> = S['response'] extends { 200: TSchema }
  ? Static<S['response'][200]>
  : unknown;

export const buildRouteUrl = (
  url: string,
  params?: Record<string, unknown>,
  querystring?: Record<string, unknown>,
): string => {
  const path = params
    ? url.replace(/:([^/]+)/g, (_, key: string) => encodeURIComponent(String(params[key] ?? '')))
    : url;
  const full = new URL(`${apiBaseUrl}${path}`);
  if (querystring) {
    for (const [key, value] of Object.entries(querystring)) {
      if (value !== undefined && value !== null) full.searchParams.set(key, String(value));
    }
  }
  return full.toString();
};

export const apiFetch = async <S extends RouteSchema>(
  route: SharedApiRoute<S>,
  locale?: string,
  options?: CallOptions<S>,
): Promise<RouteResponse<S>> => {
  const url = buildRouteUrl(
    route.url,
    options?.params as Record<string, unknown> | undefined,
    options?.querystring as Record<string, unknown> | undefined,
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
    logger.apiError(route.method, url, response.status, response.statusText);
    throw new ApiError(response.status, `Request failed: ${response.status} ${response.statusText}`);
  }
  logger.perf(`api.${route.method.toLowerCase()}.${url}`, durationMs);
  return response.json() as Promise<RouteResponse<S>>;
};
