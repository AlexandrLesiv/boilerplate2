import type { Component } from 'solid-js';
import { lazy } from 'solid-js';

import type { Params, RouteDefinition } from '@solidjs/router';

import type { Translations } from '../i18n';
import type { JsonLdSchema } from '../seo/JsonLd';

export type { JsonLdSchema } from '../seo/JsonLd';
export { defineJsonLd } from '../seo/JsonLd';

export type RouteMeta = {
  title: string;
  description?: string;
  robots?: string;
  /** A path (e.g. `/news/123`), not a full URL — `RootLayout` passes it through `absoluteUrl`. */
  canonical?: string;
  schema?: JsonLdSchema | JsonLdSchema[];
};

export type AppRouteInfo<TData = undefined> = {
  load?: (params: Params) => Promise<TData> | TData;
  meta: (data: TData, t: Translations) => RouteMeta;
};

export function defineRoute<TData = undefined>(
  config: Omit<RouteDefinition, 'info' | 'children'> & {
    info?: AppRouteInfo<TData>;
    children?: RouteDefinition[];
  }
): RouteDefinition {
  return config as RouteDefinition;
}

/**
 * Thrown in place of whatever a route's own `import()` rejected with. A failed dynamic import
 * throws a plain `TypeError` in every evergreen browser — the exact same type a failed `fetch`
 * throws — with no distinct error subtype to `instanceof`-check, only browser-specific (and
 * unstandardized) message text to tell the two apart. Wrapping the import once, here, lets
 * `RouteErrorBoundary` tell them apart with a plain `instanceof ChunkLoadError` instead of
 * pattern-matching error messages that could change across browser versions.
 */
export class ChunkLoadError extends Error {
  constructor(cause: unknown) {
    super('Failed to load a route chunk', { cause });
    this.name = 'ChunkLoadError';
  }
}

/**
 * `lazy()`, with a failed import rethrown as `ChunkLoadError` — see its own doc comment. Use this
 * instead of solid-js's own `lazy()` for every route's `component`. `Component<any>` matches
 * solid-js's own `lazy()` signature exactly (its type declaration uses the same constraint) — this
 * wraps that function unchanged, so narrowing it here would just be a type assertion in disguise.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyRoute = <T extends Component<any>>(load: () => Promise<{ default: T }>) =>
  lazy(() =>
    load().catch((error: unknown) => {
      throw new ChunkLoadError(error);
    })
  );
