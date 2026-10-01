# Lightbox

Full-screen image/content viewer with gallery navigation, built on the same native `<dialog>`
mechanics as `Dialog` (via `common/libs/dialog/useNativeDialog.ts`) plus a manual FLIP
(First-Last-Invert-Play) animation for the grow-from-thumbnail open/close effect. See
`common/libs/flip/index.ts` for the technique itself — this file covers what's specific to using
it here.

## Why FLIP, not the View Transition API

The obvious platform tool for "grow from one element's position/size into another's" is
`document.startViewTransition`'s shared-element mode (`view-transition-name`). An earlier version
of this component used it, and it mostly worked — but it had a timing dependency on when Solid
actually commits a DOM mutation relative to when VT captures its "new" frame, and that dependency
wasn't always true: confirmed live, repeatedly, as a real (not hypothetical) ghosted
double-exposure on open, reproducible independently of any unrelated devtools state. A manual FLIP
sidesteps the whole problem — it measures rects itself, with full control over the timing, and
only ever touches `transform` on one element it owns. Slower to reach for, but nothing about its
correctness depends on a browser-internal capture/callback race.

## Why `renderItem` is a `RenderProp`, called once, not a thunk per item

Each `LightboxItem`'s content isn't carried as its own `() => JSX.Element` (the pattern `Dialog`
uses for its static `children`). Lightbox instead takes one `renderItem: RenderProp<LightboxItem<T>>`
and calls it exactly once per open session, inside `<Show when={mounted()}>`, with an accessor
that keeps pointing at whichever item is current. The alternative — storing a thunk per item and
switching which thunk is rendered on next/prev — would tear down and rebuild the whole content
subtree on every navigation, the exact render-churn `RenderProp` (`common/types.ts`) exists to
prevent. With the accessor form, a `renderItem` written with Solid's own control flow
(`Show`/`Switch` keyed on `item().data`'s shape) only updates the parts that actually changed.

## `useNativeDialog`'s effect must track exactly one thing: `props.open()`

Two different ways for it to accidentally track more than that, both confirmed live by the same
symptom — a duplicated `lightbox.open`/`lightbox.navigate` log line, and (back when this used View
Transitions) a console warning about a skipped transition. With FLIP the collision is quieter — a
second `runFlip` call retargeting `.content`'s `transform` transition while the real one is still
playing — but the underlying cause and the fix are identical, so both guards stay:

1. **`isOpen` must be a memo, not a plain derived function.** If `open` were
   `() => props.activeIndex !== null` passed as-is, the effect tracks `activeIndex` itself
   (whatever it reads), re-running on *every* index change — including next/prev, while already
   open. `createMemo` makes the tracked value the *boolean*, so the effect only reruns when
   open/closed actually flips.
2. **`useNativeDialog`'s effect body must be wrapped in `untrack`, apart from the `props.open()`
   read.** Lightbox's `runTransition` callback reads other signals of its own while deciding what
   to measure/log — `mounted()`, `lastIndex()` (via `activeItem()`), `total()`. Since
   `runTransition` is invoked *from inside* this effect, any signal it reads during that call is
   adopted as a dependency of this effect too, unless that call happens inside `untrack`. Without
   it, a plain next/prev's `setLastIndex` — called from a completely separate effect — retriggers
   *this* effect as a side effect, which re-enters the open branch (since `isOpen()` is still
   true) and fires a second, spurious FLIP animation on top of the real (non-existent, for
   next/prev) one.

The close branch also skips the FLIP entirely via `if (!mounted()) return mutate()`:
`useNativeDialog`'s effect always runs once on mount, taking the close branch if `activeIndex`
starts `null` (the normal case) — in plain `Dialog` that's a harmless native no-op (`ref.close()`
guarded by `ref.open`), and here it would otherwise measure a trigger rect and animate `contentRef`
from nothing, for no reason, before the user has done anything.

## The open FLIP is deferred a frame, not a microtask — a microtask was tried and is a real race

`mutate()` calls `setMounted(true)`, which makes Solid render `.content` (and thus assign
`contentRef`) — but that DOM commit isn't guaranteed synchronous by the very next line, the same
issue `Dialog/AGENTS.md` documents for its own `showModal()` call. `flipFrom` needs `contentRef`
to exist and already be laid out at its final position before it can measure "last" and compute
the invert transform. The first version of this wrapped the call in `queueMicrotask`, mirroring
Dialog's fix — but that turned out to be a genuine, intermittent race, confirmed live: a plain
`queueMicrotask` has no ordering guarantee relative to Solid's *own* internal reactive flush,
which may itself be scheduled via a microtask. Whichever happened to run first won — sometimes
the content was laid out in time, sometimes it measured a zero-sized box, producing an invalid
`scale(Infinity)` that the browser silently drops, which looks exactly like "no animation, jumps
straight to the end state." `requestAnimationFrame` fixes it because it only fires after the
browser has committed layout for the current frame — not just "some microtask has run," but
specifically "layout is actually done" — a strictly stronger guarantee than any microtask
ordering can provide. If a similar intermittent "sometimes it just doesn't animate" symptom shows
up elsewhere, suspect a microtask-vs-microtask race before anything else.

## `.content` is split in two — the FLIP target can't be the padded element

`contentRef` (what `flipFrom`/`flipTo` measure and transform) must have *zero padding of its own*.
`getBoundingClientRect()` reports an element's border box (padding included), but a
`width/height: 100%` child sizes itself against that element's *content* box (padding excluded) —
so transforming the padded element directly, as an earlier version did, scaled a box that was
always bigger than what its child actually filled, by exactly the padding amount, on every single
frame of the animation, not just the first one. Reported live and confirmed by comparing the
child's rect to the parent's at matching timestamps — they never agreed, off by a consistent,
non-trivial percentage throughout.

The fix is the split in `styles.css.ts`: `content` (padding, safe-area insets, centering — never
transformed, always the full dialog size) wraps `contentInner` (zero padding, `width/height: 100%`
of `content`'s now-smaller content box, the actual FLIP target in `Lightbox.tsx`). With nothing
padded between `contentInner` and its own child, their rects are identical at every frame —
verified live by sampling both on every `requestAnimationFrame` tick through a full open
animation and finding them pixel-identical throughout, not just at rest. If any future change
adds padding, a border, or anything else box-model-affecting to the element `contentRef` points
at, this exact mismatch comes back — the padding has to live on an ancestor that's never the FLIP
target, not on the target itself.

## Why `contentInner` has a dynamic aspect ratio at all — and why it isn't hardcoded

The box can land on the exact right size at every frame (confirmed — see the previous two
sections) while the *photo inside it* still looks visibly squashed or stretched, worst right at
the start of the open animation and gone by the time it settles. The cause: `object-fit`'s crop
is computed from the image's own **layout** box, and a CSS `transform` never touches layout, only
paint — so the crop is always computed as if the element were already at its full, settled size,
regardless of what the FLIP transform currently makes it *look* like. Thumbnails here are forced
to a fixed 16:9 crop (`fit="cover"`); before this fix, the full view's layout box was just
`width/height: 100%` of the available space — whatever shape the viewport's own content area
happened to be, almost never exactly 16:9. Those two different ratios meant
`scaleX = from.width/to.width` and `scaleY = from.height/to.height` were different numbers, and a
non-uniform `scale(sx, sy)` stretched the pixels of the already-cropped photo by exactly that
much. **A first attempt used one uniform `scale` (`Math.min(scaleX, scaleY)`) instead — this
removed the distortion but reintroduced a different, equally real problem: the box could no
longer land on the trigger's exact size on both axes simultaneously, reported live as "the sizes
are not even correct" right as the open animation starts.** Fixing one symptom by compromising on
the other isn't the fix; the two ratios have to actually match.

`contentInner`'s `width`/`height` (`styles.css.ts`) use `min(100cqw, calc(100cqh * var(--lightbox-ratio)))`
and the complementary formula for height — the same "fit the largest box of ratio R within the
container" math `object-fit: contain` does for a replaced element, applied here to a plain `div`
via container query units, set up by `content`'s `containerType: 'size'`. `--lightbox-ratio` is
set imperatively (`setContentRatio` in `Lightbox.tsx`) from the *actual* clicked trigger's own
`getBoundingClientRect()` ratio — on open, on navigate (so whichever item is current stays
correct even though navigate itself doesn't animate), and re-asserted on close right before
`flipTo` measures anything. Not hardcoded to 16:9 in the stylesheet: Lightbox has no way to know
what aspect ratio a consumer's thumbnails use, and hardcoding a value that happens to match this
one app's `THUMBNAIL_SIZE` would silently break for the next consumer that doesn't use 16:9.

With `from` and `to` sharing the exact same ratio by construction, `scaleX` and `scaleY` come out
equal on their own — `invert()` went back to a single `scale`, not because uniform-vs-non-uniform
matters anymore, but because there's no longer a mismatch for the two to disagree about. Verified
live: the `<img>`'s own rendered box matches the trigger's exact pixel dimensions at the very
first frame (not an approximation on one axis), stays at one constant aspect ratio through every
sampled frame of the animation, and `contentInner`/`<img>` remain pixel-identical to each other
throughout (the earlier padding-split fix, unaffected by this one). If this ever regresses, check
`--lightbox-ratio` is actually being read as a number by `calc()` — `setProperty` is called with
`String(ratio)`, a plain unitless number, which is what `calc()` expects it to multiply/divide
against a length; passing something with a unit attached would silently break the arithmetic.

## The FLIP mechanism itself went through two implementations — the first was WAAPI, and it was wrong

The original `flip/index.ts` used `element.animate()` with `fill: 'both'`, and worked correctly in
Chrome. Reported live, in order: jumping straight to the end state on close in Safari only, then
— after a Safari-specific fix (canceling the previous call's still-`fill`-ing animation before
starting a new one, since open's `flipFrom` and close's `flipTo` run on the *same* `contentRef`,
which stays mounted the whole open session) — the identical symptom reappeared in Firefox too.
Two different engines failing the same way, after a fix aimed at only one of them, was the signal
that this was never a single browser's bug: this repo's WAAPI usage was itself fragile, in a way
Chrome happened to tolerate and the other two didn't.

`flip/index.ts` now uses a plain CSS transition on an inline `transform` instead — set the start
transform with transitions disabled, force a synchronous layout flush by reading `offsetWidth`,
then re-enable the transition and set the end transform. This is the long-established "classic"
FLIP recipe for exactly this reason: CSS transition retargeting (setting a new value while one is
already transitioning smoothly redirects from the current computed value) is a far more
consistently specified and consistently implemented behavior across engines than stacking
multiple WAAPI `Animation` objects on one property, with or without manually canceling the
previous one. It also means close no longer needs to defer `mutate()` (native `ref.close()`) to a
later frame the way an earlier version of this file documented — the forced `offsetWidth` read
already guarantees the transition's start frame is committed before `runFlip` returns, so
whatever happens immediately after (closing the dialog) can't un-commit it.

The CSS-transition rewrite above was not verified firsthand against real Safari/Firefox sessions
either — it was reasoned from which engines failed WAAPI, not from reproducing the bug directly.
It turned out to be necessary but not sufficient: it fixed the transform animation's own
mechanism, but close still jumped straight to the end state in Firefox and Safari afterward, for
a different, unrelated reason — see the next section.

## Close depended on `allow-discrete`/`overlay` keeping the dialog rendered, and that's uneven

Closing used to call `flipTo(contentRef, ...)` then immediately call native `mutate()`
(`ref.close()`). The forced reflow inside `flipTo` guarantees the transition's *start* frame is
committed before `runFlip` returns, but says nothing about whether the element keeps being
*painted* for the rest of the transition once `close()` runs — `dialog:not([open])` is
`display: none` in the UA stylesheet, and if an engine applies that the instant `close()` is
called rather than deferring it, every descendant (including `.content`, mid-transform-transition)
stops rendering with it. The dialog's own CSS (`styles.css.ts`) used to transition `overlay` and
`display` with `allow-discrete` specifically to defer that removal — a real, intentional platform
feature for animating dialogs/popovers closed — but depending on it to keep `.content` alive for
the FLIP's duration doesn't reliably hold outside Chrome: confirmed live, the shrink still jumped
straight to the end state on close in both Firefox and Safari.

A real but insufficient bug sat alongside this: `useNativeDialog.ts`'s unmount wait used
`ref.getAnimations()` without `{ subtree: true }`, so it only ever watched the dialog's own
transitions, never `.content`'s FLIP — fixed, and worth keeping (see the comment in
`useNativeDialog.ts`), but fixing it alone did not fix the live symptom, because the problem isn't
*when* `.content` gets unmounted from the DOM — it's that the browser had already stopped
*painting* it the instant `close()` ran, regardless of unmount timing. No JS-side unmount-timing
fix can address a CSS `display: none` that already happened.

**The fix drives the close fade itself, decoupled from native `close()` entirely.** `Lightbox.tsx`
runs the content `flipTo` alongside a `data-closing`-driven backdrop fade (see the
higher-specificity `&:modal[data-closing]` rule in `styles.css.ts`) and only calls native
`close()` once *both* have actually finished. The `data-closing`-toggle-and-wait part of this isn't
written in `Lightbox.tsx` itself — it's `runAnimatedClose` (`common/libs/dialog/animatedClose.ts`),
shared with `Dialog`, which hit the identical bug afterward and needed the identical fix (see
`Dialog/AGENTS.md`'s "Close animation needs its own `data-closing` state"). `Lightbox.tsx`'s close
branch is `runAnimatedClose(dialogEl, LIGHTBOX_TRANSITION_MS, mutate, extra)`, where `extra` is an
array holding the content `flipTo` promise when there's a trigger rect to shrink into. By the time
`close()` runs, there's nothing left to visually animate, so it no longer matters whether the
engine defers `display: none` or applies it instantly. `styles.css.ts` dropped the
`overlay`/`display` `allow-discrete` transitions entirely — they're no longer needed and keeping
them would misleadingly suggest they still do something.

This has been reasoned through but still not verified firsthand against a real Safari or Firefox
session from this environment — the `firefox-devtools` MCP server was unavailable (connection
failure) while this was built, and the configured `playwright` MCP server defaults to Chromium
with no `--browser firefox`/`webkit` arg. The live report that prompted this fix came from the
user testing directly, not from this environment's own tooling. If "jumps to the end on close"
reappears on either component, suspect the `data-closing` attribute not actually being set on the
right element (`element()` returning `undefined`, e.g. the ref not attached yet) first —
`runAnimatedClose`'s own wait no longer filters by `event.propertyName`, so a stylesheet's
transition list changing shape can't silently break it the way it could before this was shared.

## The actual, final bug: Lightbox's own UI never went through any of the above at all

Every fix in the two sections above was real and necessary, and none of them were sufficient,
because none of them were the thing actually breaking on close. The close button's `onClick` and
the backdrop-click handler both called `close()` — the raw handle `useNativeDialog` returns,
`() => ref?.close()`. That calls native `dialog.close()` **immediately**, synchronously, the
instant the button is clicked — before `data-closing` is ever set, before `flipTo` ever runs,
before any of the `Promise.all`-gated logic in `runTransition`'s close branch gets a chance to do
anything. That logic only runs from `useNativeDialog`'s own effect reacting to `isOpen()` becoming
`false` — which happens *after* `props.onClose()` propagates back up and the parent clears
`activeIndex` — and by the time that effect runs, `ref.open` is already `false` because the raw
`close()` call already closed it, so the effect's own `if (!ref.open) return` guard skips
everything. The entire animated-close mechanism was correctly built and was simply never being
invoked by the component's own buttons. Confirmed live and deterministically, not engine-specific
at all: `dialog.open` reads `false` in the same tick the close button is clicked, every time, in
every browser — this would have reproduced in Chrome identically if anyone had checked
`getComputedStyle` mid-click instead of just eyeballing whether *something* animated.

**Fix:** the close button, the backdrop-click handler, and the native `cancel` event (Escape) all
now call `props.onClose()` instead of the raw `close()` handle. That routes every dismissal
through the parent's `activeIndex` state first, so by the time `useNativeDialog`'s effect runs,
`ref.open` is still `true` and the real animated close — `data-closing`, `flipTo`, the `Promise.all`
wait, native `close()` only at the very end — actually executes. Escape needed its own handling
because it doesn't go through either button: the native `cancel` event fires first and is
cancelable, so `onCancel` calls `preventDefault()` and routes through `props.onClose()` the same
way, instead of letting the browser close the dialog on its own. That `onCancel` handler
(`handleCancel`) isn't written in `Lightbox.tsx` anymore — `Dialog` needed the identical
`preventDefault`-then-`onClose` one-liner for the identical reason, so it's now
`useNativeDialog`'s own returned `handleCancel`, used by both.

The raw `close()` handle this section describes no longer exists at all — `useNativeDialog` never
returns one, so this specific bug has no path back in; any future consumer of the hook gets the
same guarantee for free.

This is the one fix in this file that was verified by directly instrumenting the live DOM
(sampling `getComputedStyle(contentRef).transform` and `dialog.open` on a timer across the actual
click), not reasoned about secondhand — and it is consistent with every previous report: it would
have broken the close animation in Chrome too, identically, had anyone checked the computed style
instead of the overall visual impression. Any `Dialog`-style component built on
`useNativeDialog` with a `runTransition` that does real async work before calling its `mutate`
must take care that **every** path which can close it — buttons, backdrop, Escape, anything else
— goes through the reactive `open` prop, never the raw `close()` handle, or the exact same bug
reappears silently.

## Next/prev has no transition at all — don't add a geometry morph here

Two gallery images rarely share an aspect ratio. FLIP's `scale()` would stretch one of them to
match the other's box, which looks like a bug, not an effect. Content swaps instantly on
next/prev; the grow/shrink affordance is reserved for open/close, where old and new are the *same*
image at two sizes and have no mismatch to begin with. A cross-fade would be a reasonable
enhancement here later, but isn't free (Solid doesn't remount `.content` on navigation by design —
see the `RenderProp` section above — so there's no natural "old element" to fade out without
deliberately keeping one around), and wasn't part of what was asked.

**But the navigate effect still has to clear a FLIP transform it never started.** `contentRef` is
the one element both the open/close FLIP *and* next/prev content-swapping share. If the user
navigates before the open (or close) FLIP has finished — a real thing users do, not just a fast
test script — the new image renders inside an element that still has an in-flight `transform`
left over from the *previous* image's open animation, computed for that image's trigger rect, not
this one. Reported live, and confirmed by checking `getBoundingClientRect()` mid-animation versus
right after clicking next: the content rendered at some arbitrary partial scale (e.g. 150×84
instead of filling the viewport) until the stale transition finished playing itself out. The
navigate effect now resets `contentRef.style.transition = 'none'; contentRef.style.transform = '';`
before swapping the index — `transition` first, specifically, not after: clearing `transform`
alone while a transition is still active would *animate* back to identity over whatever duration
was left, which is its own visible glitch, just a different-looking one.

## Pressing close before the open animation finishes used to jump to full size first

A third interrupted-FLIP bug, same family as the two above but in `flip/index.ts` itself rather
than `Lightbox.tsx`: `flipTo` used to force `element.style.transform = 'none'` (with
`transition: none`, so it snapped instantly) as its starting point, before transitioning to the
shrink target. That's the right thing to do in `flipFrom` — a fresh mount has no prior transform
to continue from, so there's nothing to retarget — but it's wrong for `flipTo`: if the open
animation is still mid-flight when close gets pressed, `contentRef` is *not* at `transform: none`
yet, and forcing it there first is a real, visible snap to full size, immediately followed by the
shrink starting from that artificial full-size state. Reported live exactly that way: "it
immediately enlarges the image before starting the leave animation."

The fix removes that forced reset from `flipTo` entirely and relies on CSS transition
retargeting instead: setting a new target value on a `transform` that's already transitioning
smoothly continues from wherever it currently is, with no jump, as long as the `transition`
declaration itself doesn't meaningfully change (same duration/easing string — which it always is
here, both callers use the same constants). Verified live by sampling `contentInner`'s rect every
frame through an open-then-interrupt-with-close sequence: the box shrinks monotonically from
whatever size it had reached at the moment close was pressed, never jumping up first.

This created a second problem needing its own fix: `invert()`'s "to" argument is supposed to be
`contentInner`'s true, settled layout size, but `element.getBoundingClientRect()` reports the
*current rendered* (i.e. transformed) box — mid-flight, that's some partial, transient size, not
the real target. `flipTo` now measures by clearing `transform`, reading
`getBoundingClientRect()`, then restoring whatever the transform was — all synchronously, before
the browser ever gets a chance to paint the momentarily-cleared state, so there's no flicker from
the measurement itself, only a correct number.

**The backdrop needed the identical fix, for an unrelated reason.** `::backdrop` was statically
`#0a0a0a` with no transition of its own, while the dialog *box* (which sits in front of it in
top-layer paint order) had the `data-closing`-driven fade. A box fading to transparent in front of
a backdrop that never changes doesn't reveal the page behind — it reveals the still-fully-opaque
backdrop, which looks identical to not fading at all. The actual page only appeared once native
`close()` finally ran and removed both together, with no fade visible the whole time leading up
to it. `::backdrop` now has the same `background-color` transition, the same `@starting-style`
entry, and the same `[data-closing]`-driven exit as the box — confirmed live by reading
`getComputedStyle(dialog, '::backdrop').backgroundColor` mid-close and seeing its alpha actually
dropping, not stuck at full opacity until the end.

## What's out of scope here, on purpose

- **Touch swipe / drag-to-dismiss.** Both reference designs (uikit, the Teams lightbox) have it;
  it's a separate chunk of pointer-event + drag-threshold logic orthogonal to the animation work
  in this component. Keyboard (arrows, Home/End, Escape) and click-based controls cover the
  original ask. Add it as its own follow-up rather than folding it in here later without
  re-reading this note.
- **`Dialog` migrating to a FLIP (or shared-element) morph from its trigger button.** Different
  risk profile — a button morphing into a large panel changes aspect ratio and shape, not just
  size, which a plain FLIP `scale()` would stretch exactly like the next/prev case above. Would
  need the "container transform" variant (the shape morphs via FLIP while the button's label and
  the dialog's content cross-fade independently), which is more work and wasn't bundled in here.

## Inherited from Dialog, still true here — except Escape, which isn't

Focus trap and focus-restore-to-trigger are native `<dialog>` behavior, not reimplemented. Escape
is **not** left to native behavior here, unlike `Dialog` — see the section above: Escape fires
`cancel` first, which this component's `onCancel` handler cancels and redirects through
`props.onClose()`, the same path the close button and backdrop click use, so the animated close
actually runs instead of the browser closing the dialog on its own. This is a real difference
from `Dialog`, not an oversight to reconcile — `Dialog` has no JS-gated close animation for native
behavior to bypass, so it never needed this.

Per `Dialog/AGENTS.md`, none of this is reliably assertable from a `play` function in this repo's
Storybook harness (the preview iframe doesn't forward Escape to native `cancel` behavior, and the
`close` event isn't reliably observed there for any trigger). Lightbox's own Escape/close stories
are smoke tests for the same reason; verify the real mechanism against the running app, not by
chasing a missing assertion in the story.
