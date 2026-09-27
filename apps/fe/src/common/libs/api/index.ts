import type { RouteSchema, SharedApiRoute } from '@repo/shared';
import { type Static, type TSchema } from '@sinclair/typebox';

import { apiBaseUrl } from '../../constants/environment';

type CallOptions<S extends RouteSchema> = (S['querystring'] extends TSchema
  ? { querystring: Static<S['querystring']> }
  : { querystring?: never }) &
  (S['body'] extends TSchema ? { body: Static<S['body']> } : { body?: never }) &
  (S['params'] extends TSchema ? { params: Static<S['params']> } : { params?: never }) & {
    signal?: AbortSignal;
  };

type RouteResponse<S extends RouteSchema> = S['response'] extends { 200: TSchema }
  ? Static<S['response'][200]>
  : unknown;

function buildUrl(
  base: string,
  url: string,
  params?: Record<string, unknown>,
  querystring?: Record<string, unknown>
): string {
  const path = params
    ? url.replace(/:([^/]+)/g, (_, key: string) => encodeURIComponent(String(params[key] ?? '')))
    : url;

  const full = new URL(`${base}${path}`);

  if (querystring) {
    for (const [key, value] of Object.entries(querystring)) {
      if (value !== undefined && value !== null) {
        full.searchParams.set(key, String(value));
      }
    }
  }

  return full.toString();
}

export function createApiCall<S extends RouteSchema>(route: SharedApiRoute<S>) {
  return async (options?: CallOptions<S>): Promise<RouteResponse<S>> => {
    const url = buildUrl(
      apiBaseUrl,
      route.url,
      options?.params as Record<string, unknown> | undefined,
      options?.querystring as Record<string, unknown> | undefined
    );

    const hasBody = options?.body !== undefined;

    const response = await fetch(url, {
      method: route.method,
      signal: options?.signal,
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(options?.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<RouteResponse<S>>;
  };
}
