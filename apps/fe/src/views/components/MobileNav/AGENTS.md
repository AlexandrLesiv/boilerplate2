# MobileNav

One `<nav>`, not a separate "mobile" and "desktop" copy of the same links. At `sm` and above it's
a plain horizontal row (the toggle button is `display: none`); below it, the toggle shows and the
`<nav>` itself is `display: none` until opened. CSS alone decides which state applies at which
width — `open()` only matters below `sm`; the signal can be `true` on a desktop-width viewport
with zero visible effect, which is intentional, not a bug to guard against.

## Not `Dialog` — a disclosure, not a modal

A mobile nav flyout doesn't need a focus trap, a backdrop, or `Escape` racing against a close
*animation* — it needs a button that reveals a region, closes on its own `Escape`/outside-click,
and otherwise stays out of the way. Reusing `Dialog`/`useNativeDialog` for this would pull in a
whole modal-dialog mechanism (top-layer promotion, scroll lock, animated close) this doesn't want:
the rest of the page should stay interactive while the menu is open. This is ARIA's plain
"disclosure" pattern instead — a button with `aria-expanded`/`aria-controls` and the region it
controls — not a dialog.

## `children: JSX.Element`, not a function — correctly, this time

`Dialog`'s `children` is a function specifically because its content must stay *unmounted* while
closed (see `Dialog/AGENTS.md`). Nothing here ever unmounts — the links exist in the DOM at every
breakpoint and every open state; only `display` changes via CSS. Making `children` a function here
would be copying a constraint from a different component without the problem that constraint
exists to solve.

## `position: absolute`, not a flex-flow wrap — real layout shift, not just a visual nuisance

First version made the open panel a `flex-basis: 100%` child, wrapping onto its own row inside
`headerLeft` (a `flex-wrap: wrap` container) — no `position: absolute`, no z-index to coordinate
with `Dialog`'s top-layer or `SkipLinks`' `zIndex: 100`. Rejected after the fact: that wrap pushes
`headerLeft` (and therefore `header`, and therefore `<main>`) taller the moment the menu opens —
a real CLS-contributing layout shift (Web Vitals), not just something that looks like one. An
absolutely positioned panel is taken out of flow entirely, so opening it repaints over existing
content instead of displacing it.

`MobileNav`'s `nav` (`styles.css.ts`) is `position: absolute; top: 100%; left: 0; right: 0` below
`sm` — its containing block is `layouts/styles.css.ts`'s `.header` (`position: relative`), not the
small `wrapper` div around the toggle, specifically so the panel spans the *header's* full width
rather than being anchored to the narrow toggle button and needing its own width/overflow
handling. `left`/`right: 0` resolve against `.header`'s padding box, which starts at its own
border edge — i.e., *outside* the header's own safe-area-aware padding — so the panel needs its
own safe-area padding (`styles.css.ts`'s `nav` mobile block) rather than inheriting the header's;
without it, content could sit under a device notch on the sides. The `wrapper` div around the
toggle+nav stays `display: contents` for the same reason as before (giving the outside-click
handler one DOM node to call `.contains()` against) — it just no longer needs to also serve as a
flex-wrap participant, since `nav` isn't in flow at all anymore.

## Outside-click and Escape: listeners only exist while open

`pointerdown`/`keydown` are attached to `document` inside a `createEffect` keyed on `open()`,
removed via `onCleanup` the moment it becomes `false` again — not attached once for the
component's whole lifetime with an internal early-return. Re-arming them only while relevant is
what keeps there being nothing to tear down except in the one case (component unmount) `onCleanup`
already has to handle, and matches the "nothing listens globally unless something is actually
open" model `useNativeDialog` already uses elsewhere in this app (see `Dialog/AGENTS.md`).

## Clicking a link closes the menu via delegation, not a per-link `onClick`

`handleNavClick` checks `event.target.closest('a')` on the `<nav>` itself. The alternative — the
caller wiring `onClick={() => setOpen(false)}` onto every single link it passes as `children` — 
works but means every future consumer has to remember to do it, and silently breaks (menu stays
open after navigating) the moment someone adds a new link and forgets. Delegating at the
container level makes it true for whatever markup ends up inside, including markup added later.

## No separate "open menu"/"close menu" label text

`props.label` stays the same string in both states — ARIA's disclosure pattern communicates state
via `aria-expanded`, not by changing the accessible name, and a screen reader announces
"Menu, button, expanded" / "collapsed" from that attribute on its own. Two label strings would be
redundant with what `aria-expanded` already says, and is one more pair of translations to keep in
sync across `en`/`ru`/`ua` for no behavioral gain.

## `aria-expanded={open() ? 'true' : 'false'}`, not a raw boolean

Explicit string literals, matching `LocaleSwitcher`'s existing `aria-current` pattern
(`views/components/LocaleSwitcher/LocaleSwitcher.tsx`) — consistency with how this codebase
already spells boolean ARIA state elsewhere, not a workaround for anything Solid gets wrong with a
raw boolean.

## Verifying the desktop (`display: none` toggle) branch — a Storybook viewport-toolbar gap

This test environment's own browser window is narrower than `sm` regardless of a story's
`viewport` parameter (that toolbar only resizes the *preview iframe's* CSS box when running
through the full manager UI — not the real `window.innerWidth` these component/story tests
actually render at; see `Dialog/AGENTS.md`'s identical note from building `getAnchorElement`).
Every story in `MobileNav.stories.tsx` therefore exercises the *collapsed/toggle* behavior by
default. The always-expanded desktop case was verified instead via a throwaway Playwright probe at
a real 1280px viewport, confirming `display: none` on the toggle and `display: flex` on the `nav`
— not assumed from reading the CSS alone.

## Stories must not click a real `href`

An early version of this component's stories used `<a href="/">`/`<a href="/news">` as sample
children. `ClosesOnLinkClick` actually clicks one — in this vitest-browser test environment that's
a real top-level navigation away from the test harness mid-run, which crashed the whole file's
test run with an opaque `Failed to run the test` error (no useful stack). Every story's sample
links use `href="#"` with `event.preventDefault()` instead. `Lightbox`/`Dialog`'s stories avoid
this same trap by never clicking a real link at all (see `CLAUDE.md`'s Storybook section — "nothing
in the suite currently exercises navigation"); this component's one link-closing behavior
specifically needs to click something, so it needs a link that's real enough to receive a click
and an accessible name, but inert enough not to navigate.
