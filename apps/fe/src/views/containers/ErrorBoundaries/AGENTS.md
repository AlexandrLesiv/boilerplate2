# ErrorBoundaries

Two components that look similar — both render `ErrorFallback` inside a `solid-js` `ErrorBoundary`
— but catch different things, at different points in the tree, and can't be merged into one.

## Why two components, not one

**`DataBoundary`** wraps a region that reads async data. It's `Suspense` + `ErrorBoundary` +
`Switch` fed by an `ApiResult<T>` prop: a known, resolved failure (`{ ok: false, status, offline }`)
renders `ErrorFallback` directly from that status; its own `ErrorBoundary` is a second-line safety
net for whatever the `children` render-prop itself throws while rendering real data (a bug in the
page, not a data failure). It lives *inside* a page component, below whatever route that page
belongs to.

**`RouteErrorBoundary`** wraps the router outlet itself, in `RootLayout.tsx`, above every page.
It exists because a page's own `lazyRoute()` import can fail *before that page — and therefore its
own `DataBoundary` — ever mounts*: nothing inside the page's component tree is running yet, so no
`DataBoundary` anywhere could catch it. Without this boundary, a failed route chunk left the URL
updated (routing had already committed) but the view frozen on whatever the *previous* route had
rendered, with nothing visible but a console network error — reproduced live by going offline and
navigating to a route whose chunk hadn't been fetched yet.

Collapsing these into one boundary at the root would mean every page's data failure also unmounts
the chrome around it (header, nav) instead of just the content region — `DataBoundary` deliberately
stays scoped to the region that actually failed.

## The shared part: `ErrorFallback`

`ErrorState/ErrorFallback.tsx` is the one piece both actually share: map a resolved `ErrorKind` to
the right error page (`ErrorState`) and gate a "Try again" button by `isRetryableKind`. Each caller
still resolves its own `kind` differently — `DataBoundary`'s data-shaped failure already carries a
status code, `RouteErrorBoundary`'s thrown error needs `errorKindOf` — so `ErrorFallback` only ever
takes the already-resolved `kind`, never an error object.

## `ChunkLoadError` — why a route failing to load needs its own error type

A failed dynamic `import()` throws a plain `TypeError` in every evergreen browser, indistinguishable
by type from a failed `fetch` (and `kinds.ts` already treats a `TypeError` as "no response" for
that reason). Telling a failed chunk apart from a failed `fetch()` by pattern-matching
`error.message` is fragile — the message text isn't standardized across browsers. `lazyRoute()`
(`common/libs/router/index.ts`) wraps `lazy()` so every route's own failed import rethrows as
`ChunkLoadError`, letting `RouteErrorBoundary` tell the two apart with a plain `instanceof` check.
Every route's `component` must be defined via `lazyRoute()`, not solid-js's own `lazy()`, for this
to apply.

## Retry: `reset()` recovers a render bug; only `window.location.reload()` recovers a chunk failure

Confirmed live, not assumed: once a dynamic `import()` for a specific URL rejects, the browser's own
module registry permanently caches that failure for the document's lifetime. A second `import()` to
the *exact same URL* rejects instantly with **zero network requests** — verified by watching the
network panel during a `reset()`-triggered retry. `lazy()`'s own internal bookkeeping (it drops its
cached promise on rejection, allowing a fresh call) can't work around this: the browser never even
attempts the request the second time. Only a full reload gets a fresh module registry.

`RouteErrorBoundary`'s retry button therefore branches on `error instanceof ChunkLoadError`:
`window.location.reload()` for a chunk failure, `reset()` for anything else. Reloading
unconditionally was tried and rejected — it would discard a soft-recoverable render error's state
for no reason; resetting unconditionally doesn't work for the chunk case at all.

**Not exercised by the Storybook test harness:** `RouteErrorBoundary.stories.tsx`'s
`ChunkLoadErrorWhileOffline`/`ChunkLoadErrorWhileOnline` stop short of clicking retry and asserting
`window.location.reload` was called — both plain assignment and `Object.defineProperty` on
`window.location.reload` throw there (`Cannot redefine property: reload`), unlike a real browser.
`GenericErrorRecoversOnRetry` does assert the `reset()` branch end-to-end (click retry, confirm the
child's second render succeeds). The reload branch was confirmed instead by watching the network
panel live against a running production build — see the retry section above.

## Connectivity-based kind resolution must come from the caller, not from inside `kindForStatus`

`kinds.ts`'s `noResponseKind`/`kindForStatus` take `offline` as a plain `boolean | undefined`
parameter rather than resolving it internally, because this runs during both the SSR render and the
client hydration render of the same failed result, and `navigator.onLine` differs between those two
passes — computing it inside `kindForStatus` made SSR paint one kind and hydration silently
recompute a different one for identical data, which Solid never reconciles (hydration adopts the
SSR markup as-is). `RouteErrorBoundary` resolves `offline` from `useConnectivity().state()` itself
and passes it into `errorKindOf`, same signal `OfflineStatus` renders from.

## Where this is wired

`RootLayout.tsx` wraps `<Suspense>{props.children}</Suspense>` (the router outlet) in
`RouteErrorBoundary`, inside `<main>`. `NewsPage`/`ArticlePage` each wrap their own data region in
`DataBoundary`. Both are the right place for what they catch; moving `DataBoundary` to sit where
`RouteErrorBoundary` is (or vice versa) was considered and rejected — see "Why two components" above.
