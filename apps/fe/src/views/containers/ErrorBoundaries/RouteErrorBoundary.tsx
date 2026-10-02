import type { JSX } from 'solid-js';
import { ErrorBoundary } from 'solid-js';

import { useConnectivity } from '@/common/libs/connectivity';
import { ChunkLoadError } from '@/common/libs/router';

import { ErrorFallback } from '../ErrorState/ErrorFallback';
import { errorKindOf } from '../ErrorState/kinds';

export interface RouteErrorBoundaryProps {
  children: JSX.Element;
}

/**
 * Catches anything a route itself throws while loading or rendering — most notably a `lazyRoute`
 * chunk failing to fetch (offline, or a stale deploy's chunk hash 404ing). Without this, that
 * throw has no boundary between the router outlet and the app root: the URL updates (routing
 * already committed) but the view stays frozen on whatever the previous route rendered, with
 * nothing to see but a console network error. `DataBoundary`'s own `ErrorBoundary` can't cover
 * this — it lives *inside* a page component, which never mounts at all if that page's own lazy
 * import is what failed. See RootLayout.tsx for where this wraps.
 *
 * `errorKindOf` already maps `ChunkLoadError` to `offline`/`unknown`/`503` by resolved
 * connectivity, same as a failed `fetch` — see its doc comment in `ErrorState/kinds.ts`. The
 * actual "map a kind to a page, gate the retry button" rendering is `ErrorFallback`, shared with
 * `DataBoundary` — this component's only job is the parts that differ: no data/pending concept at
 * all, just an `ErrorBoundary` around children that always render.
 *
 * Retry reloads the page, but *only* for a chunk-load failure specifically — not for any other
 * error this boundary might catch. `reset()` alone re-runs the lazy loader, but the *browser's
 * own* module registry permanently caches a failed dynamic `import()` for that exact URL for the
 * document's lifetime — confirmed live by watching the network panel during a retry: zero requests
 * for the chunk fire at all, it rejects instantly from the browser's own cache, with nothing
 * solid-js's internal `lazy()` bookkeeping can do about it. Only a full reload gets a fresh module
 * registry. Anything else (a genuine bug in a mounted page, for instance) falls back to the
 * boundary's own `reset()` instead — reloading the whole page for an error a soft reset might have
 * recovered from would be needlessly destructive.
 */
export const RouteErrorBoundary = (props: RouteErrorBoundaryProps): JSX.Element => {
  const { state } = useConnectivity();

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorFallback
          kind={errorKindOf(error, state() === 'offline')}
          onRetry={() => (error instanceof ChunkLoadError ? window.location.reload() : reset())}
        />
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
};
