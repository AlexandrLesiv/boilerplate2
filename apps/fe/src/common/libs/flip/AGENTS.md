# flip

Manual FLIP (First-Last-Invert-Play) helper for "this element should look like it's growing out
of / shrinking into that rect" animations. Used by `Lightbox` for its open/close effect; see
`Lightbox/AGENTS.md` for the full history of why this exists and why it's implemented the way it
is (it replaced a View Transition API version, and then its own first implementation — using the
Web Animations API — was itself replaced after cross-browser failures).

## CSS transition on an inline `transform`, not `element.animate()`

The first version of this used WAAPI (`element.animate()`, `fill: 'both'`). It worked in Chrome
and was reported, live, jumping straight to the end state on both Safari and Firefox — two
different engines, not one browser's isolated bug. `flipFrom`/`flipTo` (both built on the shared
`transitionTo` helper) do the "classic" FLIP sequence instead: set a `transform` with
`transition: none`, optionally force a synchronous layout flush by reading `element.offsetWidth`,
then set `transition` to the real value and set the end `transform`. Retargeting a CSS transition
mid-flight (setting a new value while one is already running) is specified and implemented far
more consistently across engines than composing multiple WAAPI `Animation` objects on one
property — which is also why this doesn't need to cancel anything before starting: there's only
ever one inline `transform` value in play, not a stack of `Animation` objects with their own
fill/composite semantics.

## The forced reflow is not optional, and not decorative — but only `flipFrom` needs one

`flipFrom` does `element.style.transition = 'none'; element.style.transform = invert(...); void
element.offsetWidth;` before handing off to `transitionTo`. The `offsetWidth` read is what makes
that "start" frame real rather than something the browser coalesces away — without it, the
browser is free to batch both `style.transform` writes together and apply only the final one,
which looks exactly like "the animation didn't play." This only applies to `flipFrom`: a fresh
mount has no prior transform to continue from, so it has to snap to an artificial starting point
first. `flipTo` has no equivalent snap and needs none — see "one assumes..." below, and
Lightbox/AGENTS.md's "pressing close before the open animation finishes" section for the bug that
motivated removing it.

Callers still don't need to defer whatever they do *after* `flipFrom`/`flipTo` resolve — both
return a promise that only resolves once `transitionend` has actually fired (or immediately under
reduced motion), so anything sequenced after that promise is guaranteed to run once the visual
transform has genuinely finished, not just been kicked off.

## Only `transform` is ever animated — not `width`/`height`

`invert()` always produces a `translate(...) scale(...)` string. Animating `width`/`height` (or
`top`/`left`) instead would force layout on every frame; `transform` and `opacity` are the only
properties a browser can typically animate on the compositor thread, off the main thread. This is
the whole point of using FLIP over, say, animating the element's actual computed size — the
visual effect is the same, the performance characteristics are not.

## The scale is one uniform number, not `scaleX`/`scaleY` — and why that's safe to do unconditionally

`invert()` computes a single `scale(...)`, never `scale(sx, sy)`. `object-fit` crops an `<img>`
based on the element's own *layout* box, which a `transform` never changes — so if `from` and
`to` ever had different aspect ratios, a non-uniform scale would stretch that already-cropped
photo's pixels unevenly (the outer box would still land exactly on target; the image inside would
visibly distort). This function has no way to know whether its caller's `from`/`to` ratios match.

It's safe to always use one uniform number specifically *because* `Lightbox` (the only caller)
guarantees they match: `contentInner`'s own CSS sizes it to the trigger's exact aspect ratio
before either `flipFrom`/`flipTo` ever measures it (see `Lightbox/AGENTS.md`'s `--lightbox-ratio`
section). When `from` and `to` share a ratio, `scaleX` and `scaleY` are equal anyway, so a single
`scale` isn't a compromise here — it's just simpler than writing two identical numbers. A
`Math.min(scaleX, scaleY)` version existed briefly as a workaround *before* that CSS fix existed;
it independently removed the distortion but reported live as "the sizes are not even correct,"
because it could no longer land the box on `from`'s exact dimensions on both axes when the ratios
genuinely differed. That's the sign this function alone can't fix a ratio mismatch — only hide
one symptom of it while surfacing another. If a future caller ever needs this with `from`/`to` at
genuinely different ratios, the fix belongs at that caller's layer (matching the ratios, the way
`Lightbox` does), not back here.

## Center-based math, so no `transform-origin` CSS is needed

The invert formula aligns box *centers*, not top-left corners, which is why it works with the
default `transform-origin: 50% 50%` — no CSS has to be added to the animated element. (A top-left
corner formula would need `transform-origin: 0 0` instead; either works, this just avoids touching
the consuming component's stylesheet.)

## `flipFrom` vs `flipTo` — one snaps to a fake start, the other retargets from wherever it is

`flipFrom(element, fromRect, opts)` measures `element`'s *current, untransformed* box as the
"last" state, snaps it (via the forced-reflow sequence above) to look like it's sitting at
`fromRect`, then transitions down to `transform: none`. It must be called after the element has
actually mounted and settled into its real layout position — calling it before that measures the
wrong box (this is why `Lightbox` defers the open-side call to a `requestAnimationFrame`, a
separate concern from the WAAPI-vs-CSS choice above — see `Lightbox/AGENTS.md`).

`flipTo(element, toRect, opts)` does *not* mirror that snap. It assumes `element` is currently
visible — at `transform: none`, or already mid-transition toward some other target — and asks
"what `transform` would make this look like `toRect`?", then hands that straight to
`transitionTo` with no reset first. The "what would it look like" question needs `element`'s true
*untransformed* layout rect, not whatever `getBoundingClientRect()` reports right now — if a prior
`flipFrom` is still playing when `flipTo` gets called, the live rect is some transient, partially
scaled box, not the real settled size. `flipTo` gets the real one by clearing `transform`,
measuring, then restoring whatever it was, all synchronously before any paint happens:
```ts
const previousTransform = element.style.transform;
element.style.transform = 'none';
const naturalRect = element.getBoundingClientRect();
element.style.transform = previousTransform;
```
Skipping the reset-and-snap and relying on `transitionTo`'s retargeting instead is what makes it
safe to call `flipTo` while a `flipFrom` on the same element hasn't finished — exactly the
"pressing close before the open animation finishes" case in `Lightbox/AGENTS.md`. Forcing a reset
there (as an earlier version did, mirroring `flipFrom`) is itself the bug: it snaps to full size
first, then shrinks from that artificial point, which is a real visible jump, not a storytelling
simplification.

Neither function mutates anything besides `element`'s own inline `style` — the caller owns
sequencing around the actual show/hide mutation.

## Reduced motion is a JS `matchMedia` check, not CSS — the one exception in this repo

Everywhere else `prefers-reduced-motion` is handled purely in CSS (`Dialog/AGENTS.md`), because
CSS transitions/animations declared in a stylesheet can gate themselves on a media query. A
transition set via inline style, driven entirely from JS, has no stylesheet rule to attach that
media query to — so `reducedMotionDurationMs` checks `window.matchMedia` directly and collapses
the duration to `0`, with `transitionTo` cleaning up synchronously in that case rather than
waiting for a `transitionend` that a `0ms` transition never fires. It's exported specifically so
`Lightbox`'s own `::backdrop` fade can reuse the same check — that's also an inline/attribute-
driven transition with no stylesheet rule of its own, not a second copy of this logic. See
`Lightbox/AGENTS.md`.
