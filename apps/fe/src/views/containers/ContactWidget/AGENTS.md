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

## Not `Dialog` — a non-modal grow, not a centered/full-screen modal

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

**Not currently rendered by `RootLayout`.** This file documents the component in isolation
(exercised via its own Storybook stories); wiring it into the live app is a separate decision this
work didn't make.

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
   (`styles.css.ts`) *is* the thing that changes shape — its own `width`, `height`,
   `border-radius`, `background-color`, and `box-shadow` transition directly, from whatever its
   own content naturally sizes it to, to the chat content's measured natural size. It stays
   `position: fixed` at the same `bottom`/`right` the entire time, with `top`/`left` never set,
   so growing `width`/`height` can only expand the box up and to the left from that corner —
   there's no coordinate math that could misplace it, unlike the `transform-origin` versions above.

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
`.trigger` has a permanent `2px solid primary` border and a `primary` background *while closed* —
same hue, so the border is invisible, indistinguishable from the fill. `background-color`
transitions to `surface` on open; the border never changes at all. Once the fill is white, the
exact same 2px line that was always there reads as a blue outline. One crossfading property
(`background-color`) plus one that never moves (`border-color`) is the whole effect.

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
width/height/etc. transition has actually finished settling. This is the only opacity animation
left anywhere in this component — on the *content*, never the shape.

## Closing is sequenced, not concurrent

Found live, from a screenshot: closing started the content's opacity fade-out and the shell's
shrink at the same instant, from different durations (`CONTACT_WIDGET_CONTENT_TRANSITION_MS`,
150ms vs `CONTACT_WIDGET_TRANSITION_MS`, 200ms) — for part of that overlap, the shell had already
visibly shrunk smaller than the still-substantially-opaque content sitting on top of it, so real
chat UI (bubbles, the composer) rendered outside the now-smaller blue/white box. The fix is
ordering, not a duration tweak: `ContactWidget.tsx`'s close branch now `wait()`s out
`CONTACT_WIDGET_CONTENT_TRANSITION_MS` (reduced-motion-aware) *before* measuring/shrinking the
trigger at all, so content is fully invisible before the shell visibly changes size.

**That wait is a fixed `setTimeout`, not `waitForTransition` on `panelRef`, on purpose.** Closing
can happen before content ever became visible — e.g. closed again mid-grow, before
`contentVisible` was ever set `true` — in which case `setContentVisible(false)` is a no-op (already
`false`, no value change, no transition starts), and a `transitionend` listener would wait
forever. A fixed delay always resolves regardless of whether a real transition fired. The
trigger's *own* `waitForTransition` calls don't have this problem: the open and closed sizes are
always genuinely different (a floating action button vs. a 380px chat panel), so a value change
— and therefore a real transition — is guaranteed every time `data-open` is toggled.

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
