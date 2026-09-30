# SkipLinks / SkipLink

Two components sharing this one folder and its `styles.css.ts`, the same pattern
`containers/ErrorState/` uses for `ErrorState` + `ErrorLayout` + `SupportPrompt`: they're one
cohesive feature, not independently reusable primitives, so they don't each get their own
top-level folder or story file.

- **`SkipLinks`** — the container mounted by `RootLayout.tsx`. Owns the `TARGETS` list, the i18n
  labels, and the `<nav aria-label>` wrapper.
- **`SkipLink`** — a dumb `targetId` + `label` anchor. No i18n, no router awareness; all of that is
  `SkipLinks`' job.

Both live under `components/`, not `containers/`: neither orchestrates behavior around app state
(no data fetching, no error flow) — `SkipLinks` mapping a fixed array to links is the same shape
as `LocaleSwitcher` mapping `SUPPORTED_LOCALES`, which is why it's a sibling of that rather than of
`ErrorState`.

## Why `SkipLink` calls `preventDefault` and focuses the target itself

This is the load-bearing fact behind the whole component, and it generalizes past skip links:
**any same-page `href="#id"` anchor written anywhere in this app has the same gap.**

`@solidjs/router`'s `setupNativeEvents` installs one `document`-level `click` listener
(`handleAnchorClick`, `node_modules/@solidjs/router/dist/index.js`) that intercepts *every*
same-origin anchor click, pure hash links included — it only bails out for a different origin,
an explicit `target`, `download`, or `rel="external"`, none of which a hash link has. It then
calls `evt.preventDefault()` and routes internally instead of letting the browser follow the
`href`. Its own hash handling, `scrollToHash`, only calls `el.scrollIntoView()` — it never calls
`.focus()`. So a plain `<a href="#main-content">` in this app scrolls (looks correct in a quick
look) but never moves keyboard focus, which is the actual point of a skip link and the actual
WCAG 2.4.1 requirement. `pnpm check` cannot see this; it was only caught by an
`expect(target).toHaveFocus()` assertion in a real browser (`vitest --project=storybook`) —
asserting on scroll position or visibility alone would have passed while doing nothing.

The fix is for `SkipLink`'s own `onClick` to call `event.preventDefault()` and
`document.getElementById(props.targetId)?.focus()`. Because the handler sits on the anchor itself,
it runs during the bubble phase *before* the event reaches `document`, so `handleAnchorClick` sees
`evt.defaultPrevented` and returns immediately — no double-handling, no router navigation attempt.

**Corollary:** the jump target must be focusable, or `.focus()` is a no-op. `<main>` isn't
natively focusable, so `RootLayout.tsx` gives it `id="main-content"` *and* `tabindex={-1}` —
dropping the `tabindex` silently breaks the skip link while everything still typechecks and lints.

## Why `:focus-within`, not `:focus`, on the container

The off-screen/on-screen toggle lives on `styles.css.ts`'s `container` class — the wrapping
`<nav>` — not on each `link`. The `<nav>` itself is never the element that receives focus; a
child `<a>` is. `:focus` only matches an element that is itself focused, so `&:focus` on
`container` would never fire no matter how many links inside it get tabbed to. `:focus-within`
matches as long as focus is anywhere in the subtree, which is what actually reveals the cluster
when any one of its links is focused — and keeps it revealed while tabbing from one link to the
next, however many `TARGETS` grows to.

## Extending `TARGETS`

`SkipLinks.tsx`'s `TARGETS` array has one entry today (`main-content`) because it's the only
landmark in `RootLayout` worth a dedicated jump. Adding a second (a search field, a footer) is a
one-line addition — `{ targetId: '...', label: (t) => t.common.someKey }` — not a redesign; the
container already renders however many entries the list has via `<For>`.

## Storybook: assert `toHaveFocus()`, not the transition's computed `top`

An early draft asserted on `getComputedStyle(link).top` right after focusing, to prove the reveal
happened. That's flaky by construction: `container` transitions `top` over 150ms, so a synchronous
read after dispatching focus can land mid-transition at an arbitrary intermediate value. The
stories assert the thing that actually matters — `toHaveFocus()` on the link and then on the
jump target — and leave the visual slide unasserted.
