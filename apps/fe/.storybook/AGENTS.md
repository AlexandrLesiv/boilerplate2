# Storybook instrumentation (`render-stats.ts`, `layout-shift-stats.ts`)

Both files follow the same shape: an `install*(canvasElement)` call wired into `preview.tsx`'s
`beforeEach`, a `window.__*` API so a `play` function or the browser console can read/reset it, a
toolbar toggle for an on-screen overlay that's off by default, and a story-scoped reset so
switching stories doesn't carry over the previous story's count. Read `render-stats.ts` first —
`layout-shift-stats.ts` reuses its reasoning rather than re-deriving it.

## Why `layout-shift-stats.ts` doesn't use `web-vitals`

The obvious move for "measure layout shift" is the `web-vitals` package's `onCLS`. Not used here,
on purpose: `web-vitals`' CLS implementation is windowed for a whole page-lifetime real-user-
monitoring session (it batches shifts into session windows — a new window starts after a >1s gap
or past a 5s max — and reports once, typically on `visibilitychange`/unload). That doesn't compose
with "reset before this specific interaction, read after it" the way this tool needs to. Rolling
a direct `PerformanceObserver({ type: 'layout-shift' })` observer, scoped and reset per story, is
the same primitive `web-vitals` itself is built on, without its session-batching getting in the
way. If real production CLS monitoring (feeding `logger.perf()`) is ever wanted, that's a
legitimate, separate use of `web-vitals` — the session-window semantics are exactly right for a
real user's page load, just wrong for a Storybook `play` function.

## Why `hadRecentInput` is *not* filtered out of `score`

The Layout Instability API flags a shift `hadRecentInput` when it followed user input within a
short window, and the real CLS metric excludes those shifts on the theory that a shift right
after a click was probably intentional (an accordion opening, content the user asked for). This
tool's whole purpose is the opposite: catching shifts *caused by* an interaction — a click that
reveals content and pushes everything below it is exactly the case to catch, not exclude.
`score` counts every attributable shift; `scoreExcludingRecentInput` is kept as a second field for
whoever specifically wants the "would this count against real CLS" number.

## Scoped by `sources`, not just "did anything on the page move"

Each `LayoutShift` entry carries up to 5 `sources` (the largest-impact elements that moved).
`installLayoutShiftStats` only counts an entry if at least one `source.node` is inside the
story's `canvasElement` — same reasoning as `render-stats.ts`'s `isOurs` check, so a shift in
Storybook's own chrome never counts against the story. The corollary: entries with an empty
`sources` array (the browser couldn't attribute the shift to specific elements, e.g. one caused by
something removed before attribution ran) are skipped rather than guessed at, and are invisible to
this tool. They still count toward *real* CLS on an actual page — this only claims to cover
attributable shifts.

## Not `buffered: true`

Storybook switches stories in place rather than reloading the page, but the performance-entry
buffer is one page-lifetime timeline, not scoped per observer instance. `buffered: true` would
replay every earlier story's shifts into whichever story installs next. Re-installing a fresh
`PerformanceObserver` per story (disconnecting the previous one, same as `render-stats.ts`'s
`MutationObserver`) is what keeps each story's count starting from zero, and is why `buffered` is
left at its default `false`.

## Reading the count in a `play` function: the callback is asynchronous — poll, don't read synchronously

Found via a real failure, not by inspection: a story that triggers a shift and then immediately
calls `layoutShiftStats()` reads `0`, even though the shift visibly happened and the DOM already
reflects it. The browser delivers `layout-shift` entries to the `PerformanceObserver` callback as
a separate queued task, not synchronously with the layout that caused them — so a read on the same
tick as `findByText`/`userEvent.click` resolving races it and reads stale zeros. Wrap the
assertion in `waitFor` (`storybook/test`) rather than reading once, the same way `TimedLoader`
stories wait on text rather than the region's existence for a different async reason. See
`TimedLoader.stories.tsx`'s `CausesLayoutShiftWhenRevealed` for the working pattern.

## Chromium-only, and not in TypeScript's bundled DOM lib

The Layout Instability API (`layout-shift` entries) has no Firefox/Safari support and isn't part
of TypeScript's `DOM` lib, so `LayoutShiftEntry`/`LayoutShiftAttribution` are hand-declared in
`layout-shift-stats.ts` — the same thing the `web-vitals` package itself does internally.
`installLayoutShiftStats` checks `PerformanceObserver.supportedEntryTypes` and no-ops on an
unsupported browser rather than throwing; this repo's Storybook test project runs on Chromium, so
the check doesn't block testing here, but don't assume the overlay does anything if anyone ever
opens Storybook itself in a different browser.

## A known real gap this tool surfaced, not fixed

`TimedReveal`/`TimedLoader` reserve no space before their content mounts — nothing sits in the DOM
where the spinner and message will go, so their arrival pushes whatever follows them down. This
is real, already-existing behavior in the app, not a story artifact — see
`TimedLoader.stories.tsx`'s `CausesLayoutShiftWhenRevealed`, which asserts the shift happens
rather than papering over it. Fixing it (e.g. reserving a min-height matching the loader's
rendered size) wasn't in scope for adding this tool and hasn't been done — treat it as a known,
reported gap, not a false negative in the tool.
