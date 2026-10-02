import type { Component } from 'solid-js';
import { lazy } from 'solid-js';

import type { RouteDefinition } from '@solidjs/router';

// Meta/structured-data is set by each page component directly (`<Title>`/`<Meta>`/`<JsonLd>`,
// from `@solidjs/meta` and `common/libs/seo/JsonLd`) rather than declared here — a route is just
// path + component + data preloading; it doesn't need its own meta sub-type.
export function defineRoute(
  config: Omit<RouteDefinition, 'children'> & { children?: RouteDefinition[] }
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
