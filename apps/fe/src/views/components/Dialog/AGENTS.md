# Dialog

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
- **Body scroll lock: not real, and not handled by the browser.** A page behind an open modal
  `<dialog>` still scrolls with a mouse wheel — `::backdrop` stops clicks, not scrolling.
  `Dialog.tsx` locks it itself via `scrollLocked` (`assets/styles/scroll-lock.css.ts`), applied
  with `classList`, not declaratively via `html:has(dialog[open])` — see "Custom scrollbar gutter"
  below for why the timing has to be JS-driven, not attribute-driven.
- **`scrollbar-gutter: stable` does not prevent that rule's own width jump.** Toggling `overflow`
  still changes `<html>`'s `clientWidth` by the scrollbar's width even with `scrollbar-gutter:
  stable` set on `html` — verified empirically in this repo's Chromium, several combinations tried,
  including removing `body` from flow via `position: fixed` instead of `overflow: hidden`. The
  property genuinely helps a *different* problem (content length changing between short and tall
  pages while `overflow` itself never changes, which is why it's kept permanently in `global.css.ts`
  regardless), but doesn't make an `overflow` toggle itself jump-free. The only technique that
  reliably held `clientWidth` constant in testing was forcing `overflow-y: scroll` permanently
  (always showing the scrollbar track, even on pages that don't need it) — not worth it: the jump
  only happens on pages that had a scrollbar to lock in the first place, and on a short page there's
  nothing to jump regardless of whether the rule fires.
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

## One notification path for "closed"

Escape, the close button, and a backdrop click all just call `ref.close()` — none of them call
`props.onClose()` directly. The dialog's native `close` event is the single place that calls
`props.onClose()`, so `open` can never drift out of sync with the element by one of those paths
forgetting to notify the parent. The effect that opens/closes the element in response to `open`
changing relies on this: closing via the prop (`open` flips to `false` from outside) calls
`ref.close()`, which fires the same native event, which calls `props.onClose()` again — a harmless
no-op re-notification, not a bug, and simpler than special-casing "did I close myself or was I asked
to."

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

### Content unmounting and the scroll-lock release both wait on `ref.getAnimations()`, not `transitionend`

Unmounting content the instant `open` goes false (as the "why `children` is a function" section
above describes) created a second-order problem: the box keeps fading out for 150ms via its own CSS
transition, but the content inside it — everything except the always-rendered close button — was
vanishing instantly, before that fade even started. Verified live: genuinely visible, not
theoretical, closer to "the form disappears, then an empty box lingers" than a clean close. Same
deadline applies to releasing the scroll lock (`common/libs/scroll-lock`) — releasing it earlier
would show the real, undarkened native scrollbar while `::backdrop` is still mid-fade.

Both wait on `Promise.allSettled(ref.getAnimations().map(a => a.finished))`, not on a
`transitionend` listener. This went through two earlier versions before landing here, each ruled
out by something verified live, not guessed:

1. **`transitionend` alone.** Fires for a normal close, but `prefers-reduced-motion: reduce` sets
   this transition's duration to `0s` (styles.css.ts), and a `0s` transition fires no
   `transitionend` at all — relying on it alone left content, and the scroll lock, stuck forever
   for reduced-motion users.
2. **`transitionend` plus a `setTimeout` backstop.** Added because at least one real browser
   apparently never fires `transitionend` for this transition at all — the list includes
   `overlay`/`display` transitions driven by `@starting-style`/`allow-discrete`, a newer mechanism,
   and without a backstop that left the scroll lock applied forever after every close there. Worked,
   but needed a magic slack constant (`transitionMs + 50`) on top of the CSS duration to give the
   real event a fair chance to win the race, and needed manual bookkeeping (a timer variable,
   clearing it from three different places) to stop a stale fallback from an abandoned close
   outliving a reopen.

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

## Scrollbar gutter while open — plain `padding-right`, no overlay element

`lockScroll`/`unlockScroll` (`common/libs/scroll-lock/index.ts`) replace `html`'s native
`scrollbar-gutter: stable` reservation with a JS-measured `body.style.paddingRight` for as long as
`scrollLocked` (`assets/styles/scroll-lock.css.ts`) is applied, rather than leaving the native
reservation in place. Deliberately its own module, not inline in `Dialog.tsx`: measuring the
gutter and toggling the class/padding has nothing dialog-specific about it — any other overlay
that needs to lock background scroll can call the same two functions. What *stays* in `Dialog.tsx`
is genuinely dialog-specific: *when* to call them, gated on this component's own open/close
timing and its `getAnimations()`-based close detection (see above) — none of which a generic
scroll-lock primitive should need to know about.

**Measured off `document.body.clientWidth`, not `document.documentElement.clientWidth`.** Found
via a real regression, reported on a page too short to scroll: `documentElement.clientWidth` (the
`<html>` element) is a CSSOM special case that always returns the *viewport* width, unaffected by
`scrollbar-gutter: stable`'s own reservation on itself — so `innerWidth - documentElement.
clientWidth` reads `0` on a non-scrolling page even though the reservation is real (verified live:
the header's actual rendered width was 15px narrower than that, and grew by exactly 15px once
`scrollLocked` switched the gutter to `auto`). `body`, a normal element, isn't special-cased and
reports the reduced width correctly whether or not the page currently scrolls — confirmed on both
a short page and a scrolling one, same reading (`15`) either way.

An earlier version of this also Portal-rendered a JS-positioned `<div>` over that strip to paint
`::backdrop`'s darkening onto it manually, worked around a real gap: `scrollbar-color` (the
property that would otherwise theme a *native* reserved gutter) has no Safari support, and Safari
doesn't respect a plain `background-color` painted into that specific reserved area the way Chrome
does either.

That overlay div turned out to be actively wrong once `padding-right` replaced the native
reservation, not just unnecessary — **found by screenshot, not by reading the code**: with the
overlay's `display` toggled off in a live page, the strip it covered matched the rest of the
backdrop-darkened page exactly; with it on, that strip was visibly darker. The reason: `::backdrop`
is a full-viewport, top-layer pseudo-element — it already darkens *plain padding on `body`*
uniformly in every browser, since there's nothing scrollbar-specific left for it to fail at once
the native `scrollbar-gutter`/`scrollbar-color` mechanism is out of the picture entirely. The
overlay was painting its own `rgba(0,0,0,0.5)` on top of a strip `::backdrop` was already covering,
stacking two semi-transparent layers into one visibly darker seam at the edge. Deleted; do not
reintroduce a coloring element for this unless the reservation mechanism goes back to being
`scrollbar-gutter`-based (native or otherwise), at which point the Safari gap above is real again.

- **Width still measured before `scrollLocked` is applied, not after** — `scrollLocked` sets
  `overflow: hidden`, which removes the native scrollbar; measuring afterward reads ~0 regardless
  of whether the page actually had one, squishing the layout by the scrollbar's width instead of
  compensating for it. This was a real regression, not a hypothetical: reads a scrollbar-having
  page's width, opens a dialog, watches content visibly shift.
- **`scrollLocked` releases once the close has visually finished, not on `open` going false.**
  Still true without the overlay: `:has(dialog[open])` (or releasing immediately in JS) stops
  matching the instant the attribute is removed, before the closing fade even starts, and
  releasing `overflow` right then would bring back the real, undarkened native scrollbar while
  `::backdrop` is still mid-fade for another 150ms — a page that's still visibly
  darkening/undarkening next to a scrollbar that already looks normal. See the `getAnimations()`
  section above for how `Dialog.tsx` detects "visually finished" and why.

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
verified against the actual compiled CSS output, not assumed from the package's docs. Animation
uses `transition` + `@starting-style` + `allow-discrete` on `opacity`/`transform`/`overlay`/
`display` so the dialog doesn't snap in/out abruptly, and is disabled under
`prefers-reduced-motion: reduce`, matching the pattern already established in `TimedLoader`.

## What this doesn't handle

- **Nested dialogs.** Opening a second `Dialog` from inside one that's already open is untested and
  likely wrong (native dialog stacking + our single scroll-lock toggle would need real thought, not
  a guess) — treat as unsupported until a concrete need justifies building and testing it.
- **Screen-reader browse-mode reach into background content.** Verified: real mouse clicks and Tab
  navigation can't reach it. Not independently verified with an actual screen reader's virtual
  cursor — do that before relying on this for anything more sensitive than a login form.
