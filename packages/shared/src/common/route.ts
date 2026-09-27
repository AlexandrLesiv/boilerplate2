import { type Static, type TSchema } from '@sinclair/typebox';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteSchema {
  tags?: string[];
  summary?: string;
  description?: string;
  body?: TSchema;
  params?: TSchema;
  querystring?: TSchema;
  headers?: TSchema;
  response?: Record<number, TSchema>;
}

export interface SharedApiRoute<S extends RouteSchema> {
  url: string;
  method: HttpMethod;
  schema: S;
}

export function defineSharedApiRoute<S extends RouteSchema>(route: SharedApiRoute<S>): SharedApiRoute<S> {
  return route;
}

export type InferRouteResponse<T extends SharedApiRoute<RouteSchema>, Status extends number = 200> =
  T['schema']['response'] extends Record<number, TSchema>
    ? Status extends keyof T['schema']['response']
      ? Static<T['schema']['response'][Status]>
      : never
    : never;

export type InferRouteQuerystring<T extends SharedApiRoute<RouteSchema>> =
  T['schema']['querystring'] extends TSchema ? Static<T['schema']['querystring']> : never;

export type InferRouteBody<T extends SharedApiRoute<RouteSchema>> =
  T['schema']['body'] extends TSchema ? Static<T['schema']['body']> : never;
