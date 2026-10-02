# ContactWidget

The ecommerce "chat with us" / "ask a seller" floating action button, generalized: this app has
no seller/product domain, so the copy is domain-neutral ("Ask a question") rather than assuming
one. Rendered once by `RootLayout`, visible on every page, same placement model as `LoginDialog`.

## It's a scripted chat, not a form — and not a real backend

There is no support backend in this app, and building one (a WebSocket/polling endpoint, a real
responder) wasn't in scope. `ContactChat` is a real chat *interface* — message bubbles, a `role="log"`
region, a typing indicator, an input that stays put while the log scrolls — wired to a scripted,
frontend-only responder: every sent message gets the next reply from a small rotating pool
(`common.contact.commonReplies`, three generic acknowledgements) after a fixed `REPLY_DELAY_MS`
(500ms) "typing" delay. It is not content-aware — it never reads what the user typed beyond
logging its length — so it can't misfire in a locale-unsafe way (a keyword-matching responder
tuned to English words would silently stop working for the `ru`/`ua` locales). If a real backend
chat ever gets built, replace `handleSubmit`'s `setTimeout` branch with whatever the real
transport is (WebSocket message handler, polling response, SSE) — the message list, bubble
rendering, and log semantics don't need to change.

**Earlier version was a contact form**, not a chat (email + message fields, a `SupportPrompt`-style
no-op submit). Replaced after direct feedback that "ask a seller" implies a real-time back-and-forth,
not a one-shot message — same no-backend constraint, different interaction shape.

## `role="log"`, not a generic container

ARIA's `log` role is specifically for "a type of live region where new information is added in a
meaningful order and old information may disappear" — this is the one ARIA role actually built for
a chat transcript, as opposed to `role="status"`/`alert` (one-shot announcements) or a plain `<div>`
(nothing announced to assistive tech at all). New messages and the typing indicator are both inside
it, so both are picked up by the same live region.

## Typing indicator: visually decorative, separately announced

The three pulsing dots are `aria-hidden="true"` — same "icon is decorative, hidden span carries the
meaning" split `Link/AGENTS.md` already established — paired with a `visuallyHidden` text node
("Agent is typing…") inside the same `<Show>`, so a screen reader announces the state change via
the `role="log"` region picking up the new text node, not by trying to describe pulsing circles.

## Superseded: everything from here through "## Mobile" describes the pre-`<dialog>` design

**This section and the ones through `## Mobile` below are historical, not current behavior.**
They describe an earlier non-modal version — `.trigger` itself resizing, a `triggerFill`/
`panelContent` sibling pair, `clip-path`/`clipFor`, no native `<dialog>` at all. That design was
replaced by a native `<dialog>` (see "Swapping to a native `<dialog>`" below) after direct
feedback asking for the dialog's own semantics specifically. Kept rather than deleted, same as
this file's own convention of keeping wrong shapes as a record — but anyone orienting on current
behavior should skip ahead to "Swapping to a native `<dialog>`".

Historical content, for context on *why* some of the current design looks the way it does (the
clip/reveal problem in particular rhymes with the old `clip-path` mechanism this section
describes):

An earlier version opened `Dialog` (via `getAnchorElement`, anchored to the trigger). Replaced
after direct feedback: the right mental model for a chat-launcher FAB isn't "open a modal," it's
"the button becomes the panel" — the real, recognizable chat-widget pattern (Intercom/Drift/
Zendesk), where the panel stays docked in the same corner and the rest of the page stays fully
interactive. That's a different a11y contract from `Dialog`, not just a different animation:
non-modal means no focus trap, no `aria-modal`, no backdrop, and no native `<dialog>` at all. The
panel is a plain `role="region"`, toggled by the trigger's `aria-expanded`/`aria-controls` pair —
the same ARIA disclosure shape `MobileNav` already uses, not `Dialog`'s modal one. Escape and
outside-click close it and return focus to the trigger, mirroring `MobileNav`'s identical pair of
listeners (re-armed only while open), for the same reasons documented there.

## The trigger morphs; nothing new is painted until it's already the right shape

This went through four wrong shapes before landing here, each corrected from a live screenshot or
direct feedback, not guessed in advance:

1. A non-uniform FLIP-style scale matching the trigger's exact rect (`ContactWidget/morph.ts`,
   since deleted) — *"what I expect is a button itself would be getting morphed... white
   container grows out of the center of button."*
2. A `transform: scale()` grow from the button's *center*, with a JS-measured `transform-origin`
   custom property and a paired opacity fade — corrected twice: *"There should not be fade in out
   effect and in the opened state I still can see the button behind. At least its shadow"*, then
   *"transform origin... should [be] at right bottom corner of the button."*
3. The same `scale()` approach, corrected to pivot at the bottom-right corner instead — still
   wrong, and the screenshot showing why is the useful part: a box mid-`scale()` keeps the
   *panel's* aspect ratio at every size, so at 10% scale it's a small rounded square, nothing
   like the actual wide, pill-shaped button. It can never resemble the thing it's supposedly
   replacing, which is why it read as "a new overlay get painted over the button" rather than the
   button changing shape, no matter how its position was anchored.
4. **Current**: no `scale()`, no separate shell element pretending to be the button. `.trigger`
   (`styles.css.ts`) *is* the thing that changes shape — its own `width`/`height` transitions
   directly, from whatever its own content naturally sizes it to, to the chat content's measured
   natural size. It stays `position: fixed` at the same `bottom`/`right` the entire time, with
   `top`/`left` never set, so growing `width`/`height` can only expand the box up and to the
   left from that corner — there's no coordinate math that could misplace it, unlike the
   `transform-origin` versions above. (`background-color`/`box-shadow` *used* to transition on
   `.trigger` directly too, alongside `width`/`height` — moved to a child element, `triggerFill`,
   for a WebKit-specific reason explained further down.)

**Tried `transform: scale()` again, later, specifically to fix Safari jank — reverted, worse.**
Animating `width`/`height` directly forces a synchronous layout recalculation every frame —
direct feedback: *"you are animating width and height there which look junky in safari."*
`transform: scale()` is composited (no per-frame layout cost), so it looked like the fix — but
`scale()` visually magnifies *everything* about the element along with its size, including
`border-width` (a permanent `2px` border, scaled up ~7x to the panel's size, rendering as ~14px)
and `border-radius` (non-uniform `scale(x, y)` makes rounded corners render elliptical). A
"two-phase" attempt — animate via `scale()`, then instantly swap to real `width`/`height` once
settled, so the border/radius only render crisp *after* the motion — introduced a worse bug than
the one it fixed: `.trigger` already had an active `transition: transform` declared for the
grow, so the "instant" swap back to `transform: none` was itself treated as a second, real,
transitioned value change — the box visibly grew to the open size (`width`/`height`, instant)
while `transform` animated back down from `scale(x, y)` toward `none` *on top of* that
already-full-size box, i.e. "grows gigantic, then shrinks to normal," confirmed live as a real
bug. `width`/`height` have neither problem — a border's rendered width is never affected by the
element's own `width`/`height` — so the Safari jank is the accepted cost here, confirmed by
direct instruction to stop pursuing `transform` as the fix.

**Mitigated instead with `will-change`/`contain`, which don't carry either risk above** — they
don't change *what* animates, just hint to the engine about it. `will-change: 'width, height'`
tells Safari the resize is coming before it's discovered mid-frame; `contain: 'layout paint'`
tells it this element's layout/paint can never affect anything outside its own box, so a resize
here never needs to re-check ancestors or siblings. Applied statically (not toggled on only
while animating, the usual advice to avoid an idle compositing layer) — this element is tiny and
always mounted, so the memory cost of leaving it on is negligible against the bookkeeping cost of
toggling it from JS on every open/close.

## WebKit defers paint transitions bundled with a layout one

A *different* Safari-only bug, found after `will-change`/`contain` — not jank, a correctness
bug: *"In chrome [the] inner [white] rectangle starts being visible since beginning of
animation. [In] Safari the growing rectangle is blue until the grow animation ends and just only
then starts white-out."* Confirmed by reproducing it in Playwright's WebKit build (which tracks
Safari's engine closely enough to use as a stand-in — no real Mac/Safari needed) before touching
any code: sampling `.trigger`'s computed `background-color` through the grow showed it barely
moving while `width`/`height` went from 52px to 380px, then animating the rest of the way to
`surface` *after* the resize had already finished — Chrome and Firefox run `width`, `height`,
`background-color`, and `box-shadow` concurrently as declared; WebKit, when a layout-affecting
transition and paint-only transitions are declared on the *same element*, defers the paint ones
until the layout one completes, then plays them out afterwards.

**Fix, verified in an isolated test page before changing the real component**: move
`border`/`border-radius`/`background-color`/`box-shadow` off `.trigger` onto `triggerFill`, a
child with `position: absolute; inset: 0` and no `width`/`height` transition of its own. Its size
still changes every frame — it's always exactly `.trigger`'s current size — but that's a passive
*consequence* of the parent's layout, not a declared transition on `triggerFill` itself, which is
what keeps WebKit from bundling it with the parent's layout-affecting one. `.trigger` ends up with
no visual shape of its own at all — just `width`/`height` and the layout properties
(`overflow`/`willChange`/`contain`) that go with animating them. Re-tested against the real
component in both Chromium and WebKit after the change: `triggerFill`'s `background-color` *and*
`border-radius` now track `.trigger`'s width/height progress proportionally throughout the grow in
both engines, and `triggerFill`'s own rendered size exactly matches `.trigger`'s at every sampled
frame (no geometric shift from moving the border off `.trigger` entirely).

**First pass made `border-radius` a static `1rem` instead of a closed/open crossfade** — it's
*also* paint-only, so the assumption was that animating it anywhere near `width`/`height` would
hit the identical bug, and the visual difference (0.75rem closed vs 1rem open) seemed small
enough to drop. Direct feedback: *"I think border-radius animation was needed. Bigger elements
should have bigger border radius."* Verified before reverting: `border-radius` on `triggerFill`
specifically (not `.trigger`) is exactly as unaffected by the WebKit bug as `background-color`
already was, for the same reason — the isolated test page confirmed it tracks in sync in WebKit
even with a `border` also present. The constant-value simplification was unnecessary; the actual
constraint was only ever "don't put a paint-only transition on the layout-transitioning element."

**Why this needed a *second* positioned element, not a merge into `panelContent`**: `panelContent`
already exists as a separate sibling specifically because a `<button>` can't contain another
button or the chat composer's `<input>` — but `triggerFill` has neither of those; it's purely
decorative (`pointer-events: none`), so it lives *inside* `.trigger` as an ordinary non-interactive
child, no HTML-nesting constraint in the way. `triggerContent` needed `position: relative` added
once `triggerFill` existed as a `position: absolute` sibling — positioned elements with
`z-index: auto` stack by DOM order, but an absolutely-positioned element would otherwise paint
above an *unpositioned* one regardless of DOM order, which would have buried the icon under the
fill.

**`.trigger` still needs its *own* `border-radius`, even though nothing of its own is painted
using it.** Moving the border/fill/radius to `triggerFill` and leaving `.trigger` with none at
all (reasoning: nothing on `.trigger` paints based on its own radius, so it seemed irrelevant)
missed that `.trigger` still has `overflow: hidden`, which clips *descendants* — `triggerFill`
included — to `.trigger`'s own border-radius. With none declared, the cascade fell through to
`AppButton`'s shared `boxed` look (`border-radius: 0.375rem`, 6px) and visibly clipped
`triggerFill`'s own, more generous `1rem` corners down to that tighter shape — confirmed from the
user's own inspection of the live computed CSS, not a screenshot read alone, since
`triggerFill`'s *own* `getComputedStyle().borderRadius` reports `1rem` correctly regardless of
whether an ancestor is clipping it away — checking the wrong element's computed style is exactly
how this stayed hidden through several rounds of live verification in this session. Fixed with a
static `border-radius: 1rem` on `.trigger` — the *largest* value `triggerFill` ever reaches, not
an animated match for its current one, so the clip is never tighter than what's inside it at any
point in the grow/shrink. Static, not transitioned, so it carries none of the WebKit risk
documented above.

**`ContactWidget.tsx`'s open effect, in order:** freeze the trigger's current (`auto`) size as
explicit pixels (a `width`/`height` transition can't start from `auto`, and the button's closed
size is locale-dependent, so it can't be a build-time constant either) → measure `panelRef` (the
content layer below) at its own natural size, which it lays out completely independently of the
trigger → force a reflow → write the measured size as the trigger's new explicit pixel target and
set `data-open="true"` in the same tick, so the CSS `transition` animates between the two explicit
values. Closing reverses it: temporarily clear the trigger's inline size back to `auto` to
re-read its natural closed rect (safe because the icon is hidden via `opacity`, which doesn't
collapse intrinsic sizing, not `display: none`, which would), restore, then transition back down.
Same clear-measure-restore shape `morphTo` (since deleted) used to use for `transform`, just
applied to `width`/`height` instead.

**The border reads as "the button's color becoming a border" without any border animation.**
`triggerFill` has a permanent `2px solid primary` border and a `primary` background *while
closed* — same hue, so the border is invisible, indistinguishable from the fill. Its
`background-color` transitions to `surface` on open; its `border-color` never changes at all.
Once the fill is white, the exact same 2px line that was always there reads as a blue outline.
Two crossfading properties (`background-color`, `border-radius`) plus one that never moves
(`border-color`) is the whole effect — all on `triggerFill`, none on `.trigger` itself anymore.

**The content layer (`panelContent`) owns no visual chrome of its own.** It's a separate sibling
(a `<button>` can't contain another button or an `<input>`, which the chat composer needs), styled
with the same `bottom`/`right`/`border-radius` as `.trigger`'s open state and painted after it
(higher `z-index`), but with no `background-color` or `border` — `.trigger`'s own fill and border
show through wherever `panelContent` doesn't paint something opaque of its own (text, bubbles),
which is what keeps the border visible instead of being covered by a second white layer drawn
flush against it. It still needs its *own* `overflow: hidden`/`border-radius` to clip its own
children (the chat log, bubbles near an edge) to the same rounded shape — `.trigger`'s `overflow`
only clips `.trigger`'s own content, not an unrelated sibling painted on top of it.

**Real-mouse consequence, now solved with an explicit close button.** Once open, `panelContent`
covers `.trigger`'s entire grown area, so a real pointer click can no longer land on the button
itself to re-close it. First flagged as an accepted gap (Escape/outside-click only); `.closeButton`
(`styles.css.ts`) closes that gap directly — same `top`/`right`/size/hover convention `Dialog`'s
own close button already established, `&times;` glyph, `aria-label={t().common.contact.close}`.
The `ClosesOnReclick` story still passes (and still matters to keep) because Testing Library
dispatches the click directly on the element rather than hit-testing screen coordinates, so it
doesn't prove real-mouse reachability either way — `ClosesOnCloseButtonClick` is the story that
actually covers the real affordance.

**Icon-only trigger, no visible label.** `triggerContent` wraps just the icon now; the translated
label (`common.contact.triggerLabel`) moved to the button's `aria-label` instead of visible text,
so the accessible name is unchanged even though there's nothing on screen to read it from.
`triggerContent` is still a wrapper (not styling the icon directly) in case a visible label is
ever reintroduced — see git history for the icon+label version this replaced. It's hidden
(`opacity: 0`, instant, via a selector keyed off `.trigger[data-open="true"]`) the moment the grow
starts, not animated — a fade here would just show the icon bleeding through the growing shape.

**`panelContent` stays `opacity: 0` for the entire grow**, same reasoning as every version above —
real chat UI squeezed into a tiny box would look wrong, so it's only revealed once
`waitForTransition` (`common/libs/dialog/animatedClose.ts`) resolves, i.e. once `.trigger`'s own
width/height/etc. transition has actually finished settling. `opacity` is *not* what keeps
content from rendering outside the trigger's current bounds, though — see the next section for
why that needed a second, independent mechanism.

## Clipped to the trigger's own bounds, not just timed around them

First fix for "content visible outside the shrinking box" was timing: fade `panelContent`'s
`opacity` out, then only start the shrink once that fade finished (a fixed, reduced-motion-aware
`setTimeout`, not `waitForTransition` on `panelRef` — closing can happen before content ever
became visible, in which case fading out is a no-op that starts no transition, and a
`transitionend` listener would wait forever). Direct feedback after testing it, with a
devtools-outlined screenshot showing the log/composer rendering at full size while the trigger
was already visibly smaller: still broken. Timing-based sequencing is only ever as reliable as
two independent timers happening to resolve in the same tick — fixable in principle, never
guaranteed.

**Current fix is structural, not timing-based**: `panelContent`'s own `clip-path: inset(...)` is
computed from the *same* `closedSize`/`openSize` measurements that drive `.trigger`'s own
`width`/`height`, and transitions over the *same* `CONTACT_WIDGET_TRANSITION_MS` duration, so the
visible region and `.trigger`'s own visual box move in lockstep by construction — there's no
separate timer that could drift out of sync, because there's only one pair of numbers and one
shared duration driving both. `clipFor()` (`ContactWidget.tsx`) computes the inset that reveals
only the bottom-right `closedSize`-sized region of `panelContent`'s own (always full,
`openSize`-sized) box — the exact region currently overlapping `.trigger`'s shape. `opacity`
still has a job: it's what avoids revealing a half-clipped, jumbled partial view of real chat UI
while the clip region is still widening/narrowing — `clip-path` alone would show a
correctly-bounded but visually confusing sliver of text and bubbles mid-transition.

**The clip-path fix had its own version of the exact same "instant swap gets treated as a real
transition" bug the abandoned `transform` attempt hit.** `panelContent`'s base CSS `clip-path` is
`inset(0)` (fully revealed) — so on open, writing the *closed*/clipped value first (to establish
where the reveal should animate *from*) was itself a transitionable change away from that base
value, which the very next line (the real target, `inset(0)`) would retarget back *before it had
moved any real distance* — confirmed live via `el.getAnimations()` returning empty a few
milliseconds after open, i.e. no animation ever actually ran. Fixed the same way `.trigger`'s own
instant swaps are: wrap that one starting-value write in `panelRef.style.transition = 'none'`
→ write → force a reflow (`panelRef.offsetWidth`) → restore the transition, *then* set the real
target as a separate write. The closing direction never needed this — `panelContent`'s clip-path
is already sitting at `inset(0)` (matching its base value) by the time close runs, so setting the
closed clip there is a single, genuinely transitionable write with nothing to suppress.

**Reverted along with the `transform` experiment, then had to be re-added.** When the `transform`
attempt was rolled back, this clip-path fix (independent of which property drives `.trigger`'s
own resize) was swept up in the same revert and temporarily lost, which is why the overflow bug
briefly reappeared even after `transform` was gone — worth remembering if this component's
history gets rolled back again: clip-path and the trigger's resize mechanism are two separate
fixes for two separate problems, not one combined unit.

## Swapping to a native `<dialog>`

Replaced the non-modal design above after direct feedback asking specifically for native
`<dialog>` semantics — *"Can we use native dialog with backdrop for contact widget? ... Use
native dialog just remember that morphing behavior should remain. It's for semantics"* — i.e. the
`::backdrop`, focus trap, top-layer promotion, and native Escape-via-`cancel` were the point, not
a new visual design, and the one hard constraint was that the grow-from-the-corner animation keep
working exactly as before.

**Two elements now, not one.** `dialogShell` is the `<dialog>` itself (`.showModal()`, not the
bare `open` attribute, which gives a non-modal dialog with no backdrop/focus-trap/top-layer) —
it's the thing whose `width`/`height` actually transition, anchored `position: fixed` at the same
`bottom`/`right` `.trigger` uses, with `top`/`left: auto` (the native `dialog:modal` UA stylesheet
sets `inset: 0`, and leaving `top`/`left` at their default `0` while only overriding
`bottom`/`right` is "over-constrained," resolving in `top`/`left`'s favor and anchoring the box at
the viewport's top-left corner instead — confirmed live before writing the real component).
`dialogFill` is a normal, statically-sized child (`380px`, matching the panel's natural size) that
never resizes itself; `dialogShell`'s own `overflow: hidden` reveals more or less of it as it
grows, replacing what the old `clip-path` trick (see the historical sections above) used to
simulate for a *sibling* element — unnecessary now that `dialogFill` is a real descendant.

**Three visual bugs found live in this round, all variations of the same root cause**: a border,
radius, or stroke declared on the *static* `dialogFill` is only ever correct relative to its own
unmoving rectangle — which, during the grow, essentially never lines up with `dialogShell`'s
actual (smaller, currently-animating) box on more than one side.

1. **Looked like sliding, not growing.** `dialogFill` sits flush at `dialogShell`'s *moving*
   top-left corner (the side `top`/`left` recede from as the box grows, since `bottom`/`right` are
   the fixed anchor). With no `border-radius` on `dialogShell` itself, only the one real rounded
   corner of `dialogFill` that happened to coincide with that moving point was ever rounded — the
   other three "corners" of the visible shape were arbitrary clip-cuts through `dialogFill`'s flat
   interior, with no rounding. Confirmed live via mid-grow screenshots (three sharp corners, one
   rounded, moving). Fixed with a static, non-transitioning `border-radius: 0.75rem` directly on
   `dialogShell` — a radius on the box that's actually resizing always traces its current geometry
   every frame, no transition needed for it to look right at any size.
2. **Border missing on two sides during the grow.** Same mechanism, for the stroke instead of the
   corner: `dialogFill`'s real top/left edges always coincide with `dialogShell`'s own (moving)
   top/left edges, but its real bottom/right edges are 380×388px away from that point — almost
   always past `dialogShell`'s own (anchor-fixed) bottom/right edges during the grow. So the top
   and left showed a real 2px border, the bottom and right cut through `dialogFill`'s interior
   with no stroke at all, until the box reached full size and every edge finally coincided. Fixed
   the same way as the radius: moved `border` off `dialogFill` and onto `dialogShell`, static, for
   the same reason.
3. **Close button popped in before the rest of the content.** `.closeButton` used to be a direct
   child of `dialogFill`, a sibling of `panelContent` rather than inside it — so it rendered at
   full opacity from the very first frame while `panelContent` (title, chat) was still `opacity: 0`
   waiting for the grow to settle. Moved `.closeButton` to be a child of `panelContent` instead, so
   it shares the exact same opacity curve and fades in with everything else as one reveal.
   `.closeButton`'s own `position: absolute` still resolves against `dialogFill` (the nearest
   *positioned* ancestor, not the nearest DOM parent) — moving it inside `panelContent` (which has
   no `position` of its own) doesn't change where it's actually placed.
4. **Backdrop snapped straight to full darkness, no fade.** `showModal()` makes the dialog modal
   and creates `::backdrop` in the same synchronous step — so the pseudo-element's very first
   style pass already matched `&:modal::backdrop { opacity: 1 }`, with no earlier frame at
   `opacity: 0` for the declared `transition` to animate away from. `Dialog`'s own backdrop had
   already solved this with `@starting-style` (see `Dialog/styles.css.ts`) — `dialogShell` was
   missing the same block. Fixed by adding `@starting-style { selectors: { '&:modal::backdrop':
   { opacity: 0 } } }`, which is exactly the "what to transition *from*, the first time this
   starts matching" declaration CSS provides for newly-inserted elements/pseudo-elements.
   Confirmed live by sampling `getComputedStyle(dialog, '::backdrop').opacity` every 20ms: now a
   smooth 0 → 1 climb on open and 1 → 0 on close, not an instant jump either direction.
5. **The trigger icon vanished instantly, with no fade.** Checked live before assuming this was a
   CSS problem: the icon's own computed `opacity` never left `1` — it wasn't being hidden by any
   rule at all. `dialogShell`'s top-layer promotion (from `showModal()`) means it renders above
   `.trigger` from the very first frame, and `dialogFill` is already opaque and the same size as
   `.trigger` at that instant, so the icon is fully *occluded*, not faded — there is no partially-
   transparent moment for any opacity transition on `.triggerIcon` to ever be visible through, no
   matter what CSS is added to it. (The pre-`<dialog>` design made the identical choice
   deliberately, for a related reason — see "nothing new is painted..." above.) Fixed not by
   trying to fade the occluded icon, but by drawing the *same* icon again on `dialogFill` itself
   (`closedIcon`, `styles.css.ts`), positioned at `top`/`left: 0.875rem` to match `.trigger`'s own
   padding exactly. Because `dialogFill`'s top-left coincides exactly with `.trigger`'s own at the
   instant `showModal()` runs (both are `closedSize`-sized boxes sharing the same anchor and
   border width), this icon lands in precisely the spot `.trigger`'s own icon just disappeared
   from — continuing the morph instead of restarting it — then fades to `opacity: 0` over the same
   `CONTACT_WIDGET_TRANSITION_MS` as the grow, via an ancestor-state selector
   (`'[data-open="true"] &'`, since `data-open` is set on `dialogFill`, the icon's parent, not on
   the icon itself). The SVG markup is shared between `.trigger` and this icon via a small local
   `AskQuestionIcon` component in `ContactWidget.tsx`, so the two can't drift into drawing
   different icons. Confirmed live: sampling both rects together through the grow, the icon's
   offset from `dialogShell`'s own edge stays a constant 16px (`2px` border + `0.875rem` padding)
   throughout, and its opacity falls smoothly to `0` right as the box finishes settling.

Both `border` and `border-radius` on `dialogShell` are deliberately *not* in its `transition`
list — WebKit defers paint-only transitions (`border-radius`, `background-color`, `box-shadow`)
declared on the same element as a layout-affecting one (`width`/`height`) until the layout one
finishes (see the historical "WebKit defers paint transitions" section above for how that bug was
originally found). A flat, constant value has nothing to defer — it isn't transitioning, so the
bug doesn't apply. `dialogFill` keeps its own `background-color`/`box-shadow` crossfade on open
(it never resizes itself, so it's in no danger of the same bug), but its own `border`/
`border-radius` were removed once `dialogShell` took over owning them, rather than left in place
as redundant, coincidentally-overlapping dead styling.

**Initial focus goes to the message input, not the close button.** Native `showModal()`'s own
focusing steps look for the first descendant with the `autofocus` attribute before falling back to
"first focusable element in tree order" — without it, that fallback landed on `.closeButton`
(first focusable element once it was moved inside `panelContent`, itself the first child of
`dialogFill`), so every open focused "×" instead of the input a user opening a chat panel actually
wants to type into. Fixed with a plain `autofocus` attribute on `ContactChat`'s message `<input>` —
works even though `ContactChat` only mounts (via `<Show when={mounted()}>`) in the same tick
`showModal()` is deferred to the next frame to run in, since Solid's signal updates apply
synchronously, so the input already exists in the DOM by the time the `requestAnimationFrame`
callback actually calls `showModal()`.

## Two narrow-viewport overflow bugs, both found below `sm` (576px)

**`dialogFill` was 4px wider than the space `dialogShell` actually had for it.**
`dialogShell`'s `maxWidth: calc(100vw - 2rem)` is a *border-box* limit, but at the time
`dialogFill`'s own mobile width calc (`calc(100vw - 2rem - safeAreaLeft - safeAreaRight)`) was
written, `dialogShell` had no border of its own — true then, stale after `border` moved onto
`dialogShell` (see above). So at narrow viewports where `maxWidth` actually binds,
`dialogFill` was exactly `2 * dialogShellBorderWidthPx` (4px) too wide for `dialogShell`'s
now-smaller *content* box, overflowing into its `overflow: hidden` and clipping whatever sat near
the right edge (the Send button). Confirmed live at 458px: `dialogShell.clientWidth` (422) vs.
`dialogFill`'s actual width (426). Fixed by subtracting `2 * dialogShellBorderWidthPx` in
`dialogFill`'s mobile calc — the constant is shared (not two independent `2px` literals) so the
two can't drift out of sync again the same way.

**Resizing the viewport *while open*, without closing, reintroduced the same overflow — for a
different reason.** `dialogFill`'s width is live CSS; it recalculates the instant the viewport
crosses the breakpoint, or changes at all within the mobile range (its calc reads `100vw`
directly, not just a breakpoint boolean). `dialogShell`'s width/height, by contrast, are explicit
inline pixels written once by JS when the dialog opens — nothing re-measures them again after
that unless told to. Direct feedback: *"the dialog get opened at different width then I resize.
If I open at that width initially then it works. We probably need [a] window listener for resize
to track viewport size change."* Confirmed live before fixing: open at 900px (desktop, `380px`
fill), resize to 470px without closing — `dialogFill` grows to its mobile width (434px) while
`dialogShell` stays frozen at its desktop size (380px content box), overflowing by 54px.

Fixed with a `window.resize` listener, attached once the open sequence sets its initial target
and removed once the dialog is fully closed (plus a defensive `onCleanup`, and a
remove-before-reattach guard against the rare case of reopening before a prior close's own
cleanup ran — see "Rapid open/close" below). On each resize it re-measures `dialogRef`'s natural
size the same way the initial open does (clear → read → set, no intermediate step, so there's
only one real value change for the browser to transition from) and retargets both `dialogRef`'s
size and `closedSize`.

**Why `window.resize`, not `matchMedia`.** `matchMedia('(max-width: 575px)').addEventListener`'s
`change` event only fires when that *boolean* flips, i.e. only at the exact moment the viewport
crosses 576px. `dialogFill`'s mobile width is `calc(100vw - 2rem - ...)` — it changes at *every*
pixel of resize throughout the entire mobile range, not just at the breakpoint boundary. A resize
from 500px to 400px (both "mobile") still needs a re-measure, and `matchMedia`'s query never
changes truth value across that range, so its `change` event would never fire for it.
`window.resize` is the one event that fires for any geometry change, which is what's actually
needed — and it's the same tool `Lightbox.tsx` already uses for the identical "recompute geometry
while open, on any viewport change" need.

## Rapid open/close

Same class of race `useNativeDialog` had to guard against (see `Dialog/AGENTS.md`): the
`requestAnimationFrame`-deferred callback that sets `data-open` re-checks `open()` before running,
and bails *without* touching `mounted` if the user closed again before that frame ran — the close
branch (already running by then) owns unmounting in that case, not the abandoned open path.
Reopening while a close transition is still running works the same way `Dialog`'s own retargeting
does: setting `data-open="true"` again just retargets the already-running CSS transition toward
the open end-state from wherever it currently is, rather than restarting from scratch or jumping.
Built in from the start this time, rather than found live after shipping, since the Dialog
investigation earlier in this project already established exactly what the failure looks like.

## Mobile

No separate mobile layout — `panelContent`'s own `max-width`/`max-height` (clamped to the
viewport, `styles.css.ts`) and the `sm`-breakpoint override (spans edge-to-edge instead of a
fixed 380px) are enough to cap how big `.trigger` measures and grows into; it never needed
`Dialog`'s full-screen-takeover-vs-bottom-sheet machinery, since this was never a centered/
full-screen presentation to begin with.

## Bubble colors are reused, verified pairs — not new ones

The user's own message bubble uses `primary`/`primaryContrast` — the exact pair `Link/AGENTS.md`
already verified AA-safe (5.17:1) when `AppButton`'s primary variant needed the same fix. The
agent's bubble uses `surfaceHover`/`text`, both already used elsewhere as a text-bearing surface.
An earlier pass used `themeVars.color.success` as the (now-removed) form's success-message color
without checking it as *text* contrast — axe's `color-contrast` rule caught it at 2.17:1 against
`surface`, well under AA's 4.5:1 floor. `success` was only ever verified as a *background* color
(`OfflineStatus`'s reconnected banner, white text on top of it) — the exact "don't assume a value
that passes one contrast pair passes another" lesson `Link/AGENTS.md` already documents for
`primary`/`primaryHover`/`linkText`. Don't reach for `color.success` as a *text* color anywhere
without independently verifying it against whatever it'll sit on.
