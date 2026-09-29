# TimedLoader / TimedReveal

Two components, on purpose split across the `components/` vs `containers/` boundary:

- **`TimedReveal`** (`views/containers/TimedReveal/`) — pure timing orchestration. Takes two
  content slots, `loading` and `longLoading`, and decides *when* to reveal them based on elapsed
  time. No look of its own, so per `CLAUDE.md`'s `components/` vs `containers/` test it lives in
  `containers/` even though it renders no error/data-flow logic — the same reasoning that keeps
  `ErrorState` there despite being "visually presentational".
- **`TimedLoader`** (this directory) — the concrete skin: a spinner + copy, built on `TimedReveal`.
  This is what `DataBoundary`'s pending state actually renders.

Anything else that needs a "nothing → something → something more urgent" staged reveal (a save
indicator, a long-running background job, a multi-step wizard's "still working" state) should
reuse `TimedReveal` directly with its own slots, rather than duplicating the timer/cleanup pair.

## Timing, grounded in real sources — not picked arbitrarily

- **`delayMs` default: 1000.** Nielsen's response-time research: ~0.1s reads as instant (no
  feedback needed), ~1s is where the user notices the delay but their flow of thought stays
  intact. Below 1s, showing *anything* risks reading as a glitch rather than feedback — the
  [uxdesign.cc UI Components series article on loading indicators](https://uxdesign.cc/loading-progress-indicators-ui-components-series-f4b1fc35339a)
  makes the same point: "it is advisable not to implement any explicit loading effects [below 1s],
  as it can create a glitch-like visual experience."
- **`slowMs` default: 5000.** Nielsen's third threshold (10s) is the limit for keeping the user's
  attention before they need an ETA. 5s is deliberately earlier than that — an early, low-stakes
  reassurance partway through the "flow of thought" zone, not a last resort right at the attention
  limit.

## Why `longLoading` is additive, not a replacement — and why there's no progress bar

The same uxdesign.cc article recommends switching to a *determinate* progress bar for 3–10s waits,
once duration is roughly knowable. This deliberately does not do that: a single request/response
`fetch` has no real progress fraction to report, and a fake one erodes more trust than it buys
once a user notices it doesn't move at a believable rate — the article makes the same point from
the other direction ("do not artificially prolong loading times... unnecessary animations without
clear loading feedback lead to frustration"). Staying indeterminate and adding a plain reassurance
line is the honest substitute when there's no real ETA to show. That is also why `longLoading`
*joins* `loading` instead of replacing it — the spinner is still telling the truth ("still
working"), the second line is the only thing that's new.

## The `role="status"` region is mounted from `delayMs = 0`, not when content first appears

`TimedReveal`'s wrapper div exists in the DOM immediately, before either slot ever renders — same
reasoning as `OfflineStatus`: a live region only reliably announces changes to screen readers if
it already existed before the content changed, not one inserted at the same moment as the update.
`aria-busy="true"` is set for the component's entire mounted lifetime (not tied to the visible
stage), since the underlying operation is genuinely busy from the first render even during the
silent first second — matching what's true, not what's shown.

## Storybook: don't use `findByRole('status')` to wait for a stage to change

Because the region is mounted from t=0, `canvas.findByRole('status')` resolves immediately
regardless of which stage is active — it only waits for the *element*, which was never missing.
Asserting on it right after `findByRole` resolves races the real `setTimeout`s and fails
intermittently depending on machine speed. Wait on the *text* instead (`canvas.findByText(...)`),
which polls until the content you actually care about appears. Both `TimedReveal.stories.tsx` and
`TimedLoader.stories.tsx` pass small `delayMs`/`slowMs` overrides (tens of ms) to the story-specific
stories rather than testing against the real 1000/5000ms defaults, keeping the suite fast without
needing to verify fake-timer support in the real browser test environment.

## Accessibility

- `prefers-reduced-motion: reduce` disables the spinner's rotation (`TimedLoader/styles.css.ts`) —
  the first such rule in this codebase; extend the pattern rather than reintroducing an
  unconditional CSS animation elsewhere.
- Per the uxdesign.cc article's "avoid displaying multiple instances of the same indicator" advice,
  `DataBoundary` already renders one region-scoped `TimedLoader` per boundary (e.g. once for a
  whole list), not one per item — preserve that when wiring this into new call sites.
