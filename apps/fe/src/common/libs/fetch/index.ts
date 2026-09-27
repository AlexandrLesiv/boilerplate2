import { createContext, useContext } from 'solid-js';
import type { RouteSchema, SharedApiRoute } from '@repo/shared';
import { type Static, type TSchema } from '@sinclair/typebox';

import { apiBaseUrl } from '../../constants/environment';
import { logger } from '../logger';
import type { ApiConfig } from './config';

export type { ApiConfig } from './config';

type CallOptions<S extends RouteSchema> =
  (S['querystring'] extends TSchema ? { querystring?: Static<S['querystring']> } : { querystring?: never }) &
  (S['body'] extends TSchema ? { body: Static<S['body']> } : { body?: never }) &
  (S['params'] extends TSchema ? { params: Static<S['params']> } : { params?: never }) & {
    signal?: AbortSignal;
  };

type RouteResponse<S extends RouteSchema> = S['response'] extends { 200: TSchema }
  ? Static<S['response'][200]>
  : unknown;

const buildRouteUrl = (
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


export const createApi = ({ getLocale, getToken }: ApiConfig = {}) => {
  const buildHeaders = (hasBody: boolean, extra?: Record<string, string>): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (hasBody) headers['Content-Type'] = 'application/json';
    const locale = getLocale?.();
    if (locale) headers['Accept-Language'] = locale;
    const token = getToken?.();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return { ...headers, ...extra };
  };

  const request = async <T>(
    method: string,
    url: string,
    body?: unknown,
    options?: { signal?: AbortSignal; headers?: Record<string, string> },
  ): Promise<T> => {
    const hasBody = body !== undefined;
    const t0 = performance.now();
    const response = await fetch(url, {
      method,
      headers: buildHeaders(hasBody, options?.headers),
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });
    const durationMs = performance.now() - t0;
    if (!response.ok) {
      logger.apiError(method, url, response.status, response.statusText);
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    logger.perf(`api.${method.toLowerCase()}.${url}`, durationMs);
    return response.json() as Promise<T>;
  };

  const call = <S extends RouteSchema>(route: SharedApiRoute<S>) =>
    (options?: CallOptions<S>): Promise<RouteResponse<S>> =>
      request<RouteResponse<S>>(
        route.method,
        buildRouteUrl(
          route.url,
          options?.params as Record<string, unknown> | undefined,
          options?.querystring as Record<string, unknown> | undefined,
        ),
        options?.body,
        { signal: options?.signal },
      );

  return { call };
};

export type Api = ReturnType<typeof createApi>;

export const ApiContext = createContext<Api>();

export const useApi = (): Api => {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within ApiContext.Provider');
  return ctx;
};
