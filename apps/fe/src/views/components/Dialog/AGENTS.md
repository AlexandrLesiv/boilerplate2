# Dialog

The native `<dialog>` open/close mechanics described below — `showModal()`/`close()`, the
microtask-deferred focus fix, and the `getAnimations()`-gated unmount — now live in
`common/libs/dialog/useNativeDialog.ts`, shared with `Lightbox`. This file documents *why* each
step exists; `Lightbox/AGENTS.md` documents what it adds on top (a manual FLIP grow/shrink
animation) and does not repeat this.

Native `<dialog>`, opened via `.showModal()`/`.close()`, not a custom `div[role="dialog"]`. This
repo had zero focus-trap dependency and zero `Portal` usage before this component — going native
means the browser owns focus containment, top-layer stacking, `::backdrop`, Escape-to-close, and
focus restoration, none of which had to be built or tested from scratch. That's the constraint that
decided the design: a hand-rolled trap would have been the first of its kind here, with nothing to
lean on and no way to verify it beyond writing the same tests the browser already passes.

## What's native, and what had to be built anyway

Verified live in this repo's actual browser (Chromium, via Storybook/Playwright), not assumed from
docs — see the session that built this for the exact probes:

- **Focus trap**: real. Tab/Shift+Tab never reach content behind the dialog. There's one quirk —
  the wrap from last→first passes through `document.body` as an extra stop — but that's inert, not
  a leak; the trap's actual guarantee (background stays unreachable) holds.
- **Escape + focus restoration**: real, automatic, no code needed — verified against the actual
  running app. **Not reliably testable from `Dialog.stories.tsx`**: Storybook's preview iframe
  doesn't forward Escape to the dialog's native cancel behavior in this test harness (the dialog
  stays open), and the `close` event itself — confirmed correctly wired via `addEventListener` in
  the compiled output — isn't reliably observed by anything in that same harness, spies included,
  for *any* trigger, not just Escape. `ClosesOnEscapeAndRestoresFocus` and `OnCloseCalledOnce` are
  smoke tests for this reason, not assertions of the mechanism; don't "fix" them by chasing the
  missing assertions back in without re-verifying against the real app first.
- **Backdrop blocks pointer clicks from reaching content behind it**: real — `::backdrop` covers
  the full viewport, confirmed via `elementFromPoint`, not just via `getAttribute` (which is the
  wrong check: `.showModal()` sets `aria-modal` as a computed accessibility property, not a
  reflected DOM attribute — `getAttribute('aria-modal')` reads `null` even though the accessibility
  tree correctly reports the modal semantics; verify with an accessibility snapshot, not
  `getAttribute`).
- **Body scroll lock: not real, and not handled by the browser on its own.** A page behind an open
  modal `<dialog>` still scrolls with a mouse wheel — `::backdrop` stops clicks, not scrolling.
  Locked declaratively via `:root:has(dialog[open]) { overflow: hidden }`
  (`assets/styles/global.css.ts`) — no JS at all. See "Scrollbar gutter while open" below.
- **`scrollbar-gutter: stable`, kept permanently applied (never toggled), does prevent the width
  jump from toggling `overflow`.** An earlier note here claimed otherwise, based on toggling
  `scrollbar-gutter` itself alongside `overflow` — that combination does jump. Verified live,
  repeatedly, across several viewport widths and device pixel ratios: leaving `scrollbar-gutter:
  stable` on `html` permanently and *only* toggling `overflow` keeps `clientWidth` exactly constant
  through lock/unlock, on both a short page and a scrolling one. See "Scrollbar gutter while open."
- **Centering: not real in this app.** The global `* { margin: 0 }` reset
  (`assets/styles/global.css.ts`) overrides the UA stylesheet's `dialog:modal { margin: auto }`
  default, so `styles.css.ts` restates `margin: auto` explicitly. Any other native-dialog-default
  this app might rely on later should be verified the same way rather than assumed — the reset can
  silently cancel UA defaults that look automatic in a plain HTML page.

## Imperative open, not the `open` attribute

`<dialog open={...}>` toggling the HTML attribute gives a **non-modal** dialog — no focus trap, no
top-layer, no backdrop. The component calls `.showModal()`/`.close()` on a ref inside a
`createEffect` keyed off the controlled `open` prop; the attribute itself is never touched directly.

**`showModal()` is deferred one microtask, not called inline in the same effect run.** Found via a
real regression, not by inspection: calling it immediately after `setMounted(true)` used to focus
the always-rendered close button instead of the first form field, because — verified live by
patching `showModal` to snapshot `this.innerHTML` at call time — Solid's DOM update from
`setMounted(true)` hadn't committed yet at that point; the close button was the only focusable
element that actually existed in the dialog when the browser ran its native fallback-focus step.
`autofocus` on the field doesn't fix this either (also verified live): once native focus has
already landed on the close button, a field inserted a moment later doesn't reclaim it. Wrapping
the `showModal()` call in `queueMicrotask` lets Solid's update commit first, so the browser's
native fallback focus (no explicit `autofocus` anywhere) lands on the real first field. Don't
"simplify" this back to an inline call — the close button silently wins again with no error.

## Every dismissal path calls `props.onClose()` — none of them call `ref.close()` directly

This inverts an earlier design, documented below for why it had to change. Escape, the close
button, and a backdrop click all call `props.onClose()`. None of them call the native
`ref.close()` themselves — there's no raw `close()` handle exposed from `useNativeDialog` for
`Dialog` to call anymore (removed; it had exactly one caller, and this was it). Escape's handler
(`handleCancel`, wired to the dialog's `onCancel`) isn't written locally anymore either — it's
`useNativeDialog`'s own returned `handleCancel`, since `Lightbox` needed the identical
`event.preventDefault(); props.onClose();` one-liner and there's no reason for two copies of it
to exist and potentially drift.

**Why this changed.** The previous design had all three call `ref.close()` directly, relying on the
native `close` event firing `props.onClose()` as the single notification path. That's simpler, but
it's also an immediate, synchronous native close — there's no way to run a JS-driven closing
animation *before* it, because by the time any of those three handlers' code runs, the close has
already happened. That was fine as long as the close animation was pure CSS reacting to `:modal`
no longer matching. It stopped being fine once the CSS-only close animation turned out to be
cross-browser-unreliable (see "Close animation needs its own `data-closing` state" below) and had
to be replaced with a JS-driven one that defers the real `ref.close()` until the animation finishes
— the same shape `Lightbox` already uses for its own close path, and the same reason
`Lightbox/AGENTS.md` gives for why *it* doesn't call the raw handle either: calling native `close()`
directly bypasses whatever JS closing sequence `runTransition` is supposed to run first.

The effect in `useNativeDialog` that reacts to `open` going false still works the same way as
before — `props.onClose()` flips `open` from the outside (e.g. the story's own `setOpen(false)`),
the effect notices, and calls `runTransition` with a `mutate` that performs the real `ref.close()`.
What changed is only that `Dialog.tsx`'s own internal triggers (close button, backdrop, Escape) now
go through that same path explicitly instead of taking the native-event shortcut.

## Backdrop click detection

A click on the backdrop bubbles with `event.target === ` the `<dialog>` element itself; a click
anywhere inside the actual panel content always targets that specific descendant. `target === ref`
alone isn't sufficient, though, and this was a real regression, not a hypothetical: the dialog's
own padding (`styles.css.ts`) isn't covered by any descendant either, so a click there *also*
targets `ref` — verified live via `elementFromPoint` that a point inside the padding reports the
`<dialog>` element, identically to a genuine backdrop click. `handleBackdropClick` also checks the
click's coordinates against `ref.getBoundingClientRect()`, and only closes when the point falls
outside that box — `target === ref` narrows it to "backdrop or my own padding," the rect check is
what tells those two apart.

## `children` is a function, not `JSX.Element` — found via a real regression, not by inspection

Passing children as a plain `JSX.Element` prop (`<Dialog><LoginForm/></Dialog>`) instantiates
`LoginForm` in the *caller's* scope the moment that JSX is constructed — crossing a component
boundary as an already-evaluated prop value, not lazily. Wrapping `{props.children}` in a `<Show
when={props.open}>` inside `Dialog` does not help: the instantiation already happened one level up,
before `Dialog` ever saw it. This surfaced as an actual test failure, not a theoretical concern:
`LoginDialog` renders in `RootLayout`'s header on every page, and — content mounted regardless of
`open` — its closed dialog's `LoginForm` collided with the standalone `/login` page's own
`LoginForm` on the same `id`/labelled-input pairing, breaking every `findByLabelText` in
`LoginPage.stories.tsx` with "multiple elements found." Typing `children: () => JSX.Element` and
having `Dialog` itself write `<Show when={props.open}>{props.children()}</Show>` *inline* fixes it,
because Solid's compiler only defers JSX evaluation for control-flow components (`Show`/`Match`/
`For`) when their children are authored directly in place — a lazy wrapper passed in from outside
doesn't get that treatment retroactively. Every caller passes `{() => <Content/>}`, not
`<Content/>` directly.

## Mobile: full-screen takeover below `sm`

Below the `sm` breakpoint (576px, the same scale `mixins.css.ts` uses elsewhere), the dialog fills
the viewport (`inset: 0`, no `border-radius`, safe-area-aware padding) instead of floating as a
centered card — a phone-width card leaves too little room for content, and a full-screen sheet is
the standard mobile pattern. This only changes the dialog's own box; focus trap, `::backdrop`,
Escape, and the open/close mechanism are all unchanged, since none of that is tied to viewport size.

The breakpoint is computed as a plain `575px` string via `belowBreakpoint('sm')`
(`assets/styles/responsive/breakpoints.ts`), not `calc(${responsiveBreakPoints.sm} - 1px)` —
vanilla-extract's own media-query validator rejects `calc()` inside a feature value outright (a
build-time error: "Invalid media query"), even though a real browser accepts it fine in a plain
stylesheet. Do the arithmetic in JS before interpolating, here and anywhere else a breakpoint needs
an exclusive upper bound — `belowBreakpoint` exists so that isn't reimplemented per call site.

### The rest of the page is hidden, not just inert, on mobile

A native `<dialog>` only makes the rest of the page *inert* (unclickable/untabbable) — it does not
hide it. That's invisible to the user normally, because the desktop card + backdrop already covers
everything. Once the dialog becomes a full-screen takeover on mobile, the backdrop *is* the dialog's
own box, so without an extra step the app shell would still be sitting there, rendered, underneath.

`RootLayout`'s root div carries an `appShell` class (`views/layouts/styles.css.ts`) that sets
`visibility: hidden` on itself, below `sm`, whenever it `:has(dialog[open])` anywhere in its
subtree. The obvious alternative — `display: none` on that same ancestor — was tried and rejected:
verified live that hiding an ancestor with `display: none` stops box generation for a descendant
entirely, even one promoted to the top layer by `showModal()`, taking the dialog down with it.
`visibility: hidden` doesn't have that failure mode, because unlike `display` it's inherited *and*
overridable — which is why `Dialog`'s own class (`styles.css.ts`) sets `visibility: visible`
unconditionally, reasserting itself against whatever an ancestor decided. Any future full-screen
overlay built the same way needs the same pair: the ancestor hides itself via `:has()`, the overlay
opts back in.

### `inset: 0` alone doesn't fill the viewport on `dialog:modal` — two separate UA defaults fight it

Making the mobile box actually fill the screen took more than `inset: 0`, found only by reading
`getComputedStyle`, not by guessing from the CSS written:

- `dialog:modal`'s UA stylesheet content-fit-sizes both `width` and `height` by default (not
  `auto`), so `inset: 0`'s stretch behavior — which only applies when the size is `auto` — never
  engages unless both are stated explicitly. `width` also has to cancel the base rule's `90vw`,
  which otherwise keeps applying on top of the stretch.
- Separately, Chromium's UA stylesheet sets `max-height: calc(100% - 6px - 2 * 1.2em)` on
  `dialog:modal` — breathing room intended for the normal floating-card case. That silently capped
  the mobile box ~30px short of the real viewport height *even after* the width/height overrides
  above were correct, leaving a strip at the bottom where the page behind it (backdrop-darkened, so
  visibly a different shade) showed through. `max-height`/`max-width: none` cancel both UA defaults.

### Content unmounting waits on `ref.getAnimations()`, not `transitionend`

Unmounting content the instant `open` goes false (as the "why `children` is a function" section
above describes) created a second-order problem: the box keeps fading out for 150ms via its own CSS
transition, but the content inside it — everything except the always-rendered close button — was
vanishing instantly, before that fade even started. Verified live: genuinely visible, not
theoretical, closer to "the form disappears, then an empty box lingers" than a clean close. This is
`mounted`'s only job now — the scroll lock is a separate, declarative `:has()` rule (see "Scrollbar
gutter while open") with no timing to coordinate with this at all.

Waits on `Promise.allSettled(ref.getAnimations().map(a => a.finished))`, not on a `transitionend`
listener. This went through two earlier versions before landing here, each ruled out by something
verified live, not guessed:

1. **`transitionend` alone.** Fires for a normal close, but `prefers-reduced-motion: reduce` sets
   this transition's duration to `0s` (styles.css.ts), and a `0s` transition fires no
   `transitionend` at all — relying on it alone left content mounted forever for reduced-motion
   users.
2. **`transitionend` plus a `setTimeout` backstop.** Added because at least one real browser
   apparently never fires `transitionend` for this transition at all — the list includes
   `overlay`/`display` transitions driven by `@starting-style`/`allow-discrete`, a newer mechanism.
   Worked, but needed a magic slack constant (`transitionMs + 50`) on top of the CSS duration to
   give the real event a fair chance to win the race, and needed manual bookkeeping (a timer
   variable, clearing it from three different places) to stop a stale fallback from an abandoned
   close outliving a reopen.

`getAnimations()` replaces both: it's the browser's own record of what's actually still animating
on the element, so there's no event to fail to fire and no duration to guess. Verified live
(Chromium) that `Promise.allSettled(...).then(...)` resolves at ~150ms — the real transition
duration, no added slack — for a normal close, and in ~2ms for a reduced-motion one, because a
`0s`-duration CSS transition never becomes a running `Animation` per spec, so the array is empty
and there's nothing to await. One mechanism, no separate reduced-motion branch, no manual timer.
`ref.getAnimations()` (not `document.getAnimations({ subtree: true })`) only reports animations on
the dialog element itself, so — like the old `event.target === ref` check it replaced — it can't
pick up a transition bubbling from still-mounted, mid-fade content inside it. The `if (props.open)
return` inside the `.then()` is the direct replacement for the old timer-cancellation bookkeeping:
a stale settle from an abandoned close checks the *current* prop instead of racing to clear a
timer, so a reopen before it resolves is never undone by it.

## Close animation needs its own `data-closing` state, like Lightbox — `allow-discrete` wasn't enough

The close fade/scale (`opacity`/`transform` on `:modal`, driven purely by `:modal` no longer
matching once `close()` runs) used to also transition `overlay`/`display` with `allow-discrete`,
specifically to keep the dialog rendered for the rest of the transition's duration instead of
disappearing — `dialog:not([open])` is `display: none` in the UA stylesheet, and an engine that
applies that the instant `close()` runs stops painting everything inside it, mid-transition,
regardless of what the `opacity`/`transform` transition still has left to do. `allow-discrete` is a
real platform feature for exactly this, but depending on it to keep the box alive long enough to
animate closed doesn't hold outside Chrome: reported live snapping straight to fully closed, with
no visible fade at all, in both Safari and Firefox. `Lightbox` hit the identical bug first (see
`Lightbox/AGENTS.md`'s "Close depended on `allow-discrete`/`overlay`...") and the fix here is the
same one: drive the close state from a `data-closing` attribute set by JS, let
`&:modal[data-closing="true"]` (higher specificity than `&:modal` alone, so it wins while still
modal) apply the closed look, and only call native `close()` once that transition has actually
finished. By the time `close()` runs there's nothing left to animate, so it no longer matters
whether the engine defers `display: none` or applies it instantly, and the `overlay`/`display`
`allow-discrete` transitions were dropped from `styles.css.ts` entirely — keeping them would
misleadingly suggest they still do something.

**This mechanism is not written locally — it's `runAnimatedClose`
(`common/libs/dialog/animatedClose.ts`), shared with `Lightbox`.** The first pass at this fix
*did* write it locally (a `waitForCloseTransition` matching on `event.propertyName === 'opacity'`),
reusing only `reducedMotionDurationMs` from `common/libs/flip`. That lasted about as long as it
took to notice `Lightbox` already had its own near-identical `waitForBackdropFade` — same shape,
different hardcoded property name (`'background-color'`), independently re-derived rather than
shared, for the exact same bug. Two components separately discovering and separately fixing one
mechanism is itself the signal that it belongs in `common/libs/dialog/`, not a style preference —
`runTransition`'s close branch here is now just
`runAnimatedClose(dialogEl, DIALOG_TRANSITION_MS, mutate)`, and `Lightbox.tsx`'s is the same call
with an `extra` array of promises (its content FLIP) tacked on. The shared version also drops the
`propertyName` filter entirely — it only checks `event.target === element`, resolving on the
*first* `transitionend` to fire on the dialog regardless of which property caused it, since
nothing else is transitioning on a dialog element while `[data-closing]` is set. That removes the
fragility a hardcoded property name had: the filtered version would have silently stopped working
the moment either stylesheet's transition list changed shape without the matching JS being
updated — exactly the risk both components' `AGENTS.md` flagged independently before this existed.

One gap worth knowing about: `::backdrop`'s own `opacity` transition wasn't zeroed under
`prefers-reduced-motion: reduce` before this — vanilla-extract's `@media` block only zeroes the
current style call's own top-level `transitionDuration`, not a nested pseudo-element's separate
`transition` declaration — so under reduced motion `waitForCloseTransition` would resolve
immediately (treating the duration as `0`) while the backdrop kept fading for the full 150ms
in the background after unmount. Fixed by giving `::backdrop` its own `transitionDuration: '0s'`
entry inside the same reduced-motion `@media` block, matching what `Lightbox/styles.css.ts` already
does for its backdrop.

Verified live via Playwright (Chromium), both before and after extracting `runAnimatedClose`:
sampling the dialog's `getComputedStyle().opacity` every frame through a close click shows a
smooth decay from `1` to `0` over ~150ms, with `open` staying `true` and `data-closing="true"` the
entire time, only flipping to `open: false` / `data-closing: null` once the fade has actually
reached `0`. Not independently re-verified against real Safari or Firefox from this environment —
no Firefox/WebKit-backed MCP tool was connected this session (Playwright here defaults to
Chromium). The fix is mechanically identical to the one already confirmed, by direct user testing,
to fix the same symptom in `Lightbox` across all three engines — it removes the exact
`allow-discrete` dependency that caused it there too — but if a close-animation jump is reported
again on either component, check first whether `data-closing` is actually landing on the right
element before assuming the shared mechanism itself regressed (a regression there would show up on
*both* components at once, which is itself a useful diagnostic signal now).

## Scrollbar gutter while open — one declarative rule, no JS at all

Background scroll lock is a single global rule (`assets/styles/global.css.ts`):

```ts
globalStyle(':root:has(dialog[open])', { overflow: 'hidden' });
```

`html`'s `scrollbar-gutter: stable` stays applied permanently, whether or not a dialog is open, so
locking/releasing `overflow` never changes the reserved width — nothing to measure, nothing to
compensate. `Dialog.tsx` doesn't call anything to lock or release this; `:has()` reacts to the
`open` attribute directly, so it also covers any other native `<dialog>` in the app for free, and
there's no JS state to release in `onCleanup` either.

This replaced two more elaborate approaches, in order:

1. A JS-driven `scrollLocked` class + a JS-measured `body.style.paddingRight`, compensating for a
   `scrollbar-gutter` that toggled between `stable`/`auto`. Dropped after confirming, live across
   several viewport widths and device pixel ratios, that a *permanent* `stable` needs no
   measurement or compensation at all — the whole class of bug (wrong measurement, rounding,
   `documentElement.clientWidth`'s CSSOM root-element special case) doesn't exist if the reserved
   width never changes in the first place.
2. Before that, a JS-positioned `<div>` painting `::backdrop`'s darkening onto the reserved strip,
   to work around `scrollbar-color` having no Safari support. Dropped once `::backdrop` was
   confirmed to already darken plain, never-toggled reserved space uniformly on its own — nothing
   scrollbar-specific was left for it to fail at.

The one real cost of going fully native and JS-free: the reserved gutter doesn't darken to match
`::backdrop` while a dialog is open, and releases the instant `open` is removed rather than
waiting for the closing fade — both accepted for the simplicity and correctness guarantee. Don't
reintroduce JS-driven locking for this without re-confirming the native rule actually has a
problem first, e.g. it didn't when this section was written.

**Footgun for later, if width-measurement JS ever comes back here or elsewhere:**
`document.documentElement.clientWidth` (the `<html>` element specifically) is a CSSOM special case
that always returns the *viewport* width, ignoring any `scrollbar-gutter` reservation on itself —
`document.body.clientWidth` is the one that reports the real, reduced width.

### A long `/** */` doc comment directly above a `.css.ts` `style()` call can crash SSR

Found by bisection, not by reading a changelog: in this repo's dev toolchain (Vite Plus / rolldown,
vite-node SSR), a multi-line JSDoc-style block comment (`/** ... */`, roughly 10+ lines) sitting
immediately before an exported `style(...)` call intermittently — actually deterministically, per
file — breaks vanilla-extract's file-scope tracking, crashing every SSR render with "Styles were
unable to be assigned to a file." Comment *content* doesn't matter (reproduced with placeholder
text, no backticks); comment *length* doesn't generalize to the whole file either — the same
line count as plain `//` lines, or as a generic non-JSDoc `/* */` block, doesn't trigger it. It's
specifically a long `/**`-style comment. Keep any comment directly above a `style()` call short
(this file's is two lines) and put the actual rationale here instead — which is also just the
convention `CLAUDE.md` already asks for.

## Styling

Fully stylable — `::backdrop` and `@starting-style` both compile correctly through this repo's
Vanilla Extract setup (`style({ '::backdrop': {...}, '@starting-style': { selectors: {...} } })`),
verified against the actual compiled CSS output, not assumed from the package's docs. The open
animation uses plain `transition` + `@starting-style` on `opacity`/`transform` so the dialog
doesn't snap in abruptly; the close animation adds a `data-closing`-attribute state on top (see
above) rather than leaning on `allow-discrete`, which turned out not to be reliable enough across
engines to use for closing. Both directions are disabled under `prefers-reduced-motion: reduce`,
matching the pattern already established in `TimedLoader`.

## What this doesn't handle

- **Nested dialogs.** Opening a second `Dialog` from inside one that's already open is untested —
  native dialog stacking would need real thought, not a guess, even though the `:has()`-based
  scroll lock itself should keep matching as long as any dialog stays open. Treat as unsupported
  until a concrete need justifies building and testing it.
- **Screen-reader browse-mode reach into background content.** Verified: real mouse clicks and Tab
  navigation can't reach it. Not independently verified with an actual screen reader's virtual
  cursor — do that before relying on this for anything more sensitive than a login form.
