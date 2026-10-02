import { keyframes, style } from '@vanilla-extract/css';

import { belowBreakpoint } from '@/assets/styles/responsive/breakpoints';
import * as safeArea from '@/assets/styles/safe-area.css';
import { FONT_SIZE_NORMAL, themeVars } from '@/assets/styles/themes.css';
import { zIndex } from '@/assets/styles/zIndex';

import { CONTACT_WIDGET_CONTENT_TRANSITION_MS, CONTACT_WIDGET_TRANSITION_MS } from './constants';

const mobileBreakpoint = belowBreakpoint('sm');

// `dialogShell`'s own border width (see its own doc comment for why the border lives there, not
// on `dialogFill`) — pulled out as a number so `dialogFill`'s mobile width calc below can
// subtract it explicitly, rather than silently assuming `dialogShell` contributes no width of
// its own on top of it.
const dialogShellBorderWidthPx = 2;

// Fixed, not sticky — same reasoning as `SkipLinks`: this floats over page content everywhere,
// not just within one scroll container. See `assets/styles/zIndex.ts` for where this sits
// relative to everything else with an explicit `zIndex`.
//
// A plain, static "small chat box" look now — no transition of its own at all. Earlier versions
// had this element grow via `width`/`height` directly; now that the open panel is a native
// `<dialog>` (see `dialogShell` below), the growing happens there instead, and this button's job
// shrinks to "the thing you click, and the thing that's sitting underneath, already the right
// color/shape, once the dialog's grown to cover it." See ContactWidget/AGENTS.md ("Swapping to a
// native `<dialog>`").
export const trigger = style({
  position: 'fixed',
  bottom: `calc(1.5rem + ${safeArea.safeAreaBottom})`,
  right: `calc(1.5rem + ${safeArea.safeAreaRight})`,
  zIndex: zIndex.contactWidgetTrigger,
  // Equal padding on every side, overriding the shared `boxed` look's asymmetric
  // `0.5rem 1rem` (sized for a text label) — icon-only, so this plus the rounded-square
  // (not `999px`-pill) `borderRadius` below forms a square, chat-box-like shape rather than a
  // round FAB — asked for directly: a closed state that already reads as "a small chat box",
  // not a generic circular button.
  padding: '0.875rem',
  borderRadius: '0.75rem',
  border: `2px solid ${themeVars.color.primary}`,
  backgroundColor: themeVars.color.primary,
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
  selectors: {
    // `dialogShell` shares this exact corner and is always at least as big as this button once
    // open, so it fully covers this element's fill — except its `box-shadow`, which isn't
    // clipped by whatever's painted on top of the element casting it. Once the dialog (and its
    // own, much darker `::backdrop`) are up, this shadow would otherwise still poke out past
    // the shared corner. Toggled for the entire time the dialog is open, not just once settled.
    '&[data-hidden="true"]': {
      boxShadow: 'none',
    },
  },
  '@media': {
    [mobileBreakpoint]: {
      bottom: `calc(1rem + ${safeArea.safeAreaBottom})`,
      right: `calc(1rem + ${safeArea.safeAreaRight})`,
    },
  },
});

export const triggerIcon = style({
  width: '1.25rem',
  height: '1.25rem',
  flexShrink: 0,
});

// The same icon, redrawn on `dialogFill` itself so the morph reads as "the icon becomes the
// panel" instead of the icon just vanishing — native `<dialog>`'s top-layer promotion means
// `dialogFill` covers `.trigger` completely from the very first frame of the grow (confirmed
// live: the icon's own computed `opacity` never left `1`; it was simply occluded, not animated),
// so there is no partially-transparent moment for a fade on `.triggerIcon` itself to ever be
// visible through. `top`/`left: 0.875rem` matches `.trigger`'s own padding exactly — at the
// instant `showModal()` runs, `dialogFill`'s top-left coincides exactly with `.trigger`'s own
// (both are `closedSize`-sized boxes sharing the same `bottom`/`right` anchor, with matching
// `2px` borders), so this icon lands in precisely the spot `.trigger`'s own icon just vanished
// from, continuing it rather than restarting it. `position: absolute` measures from the padding
// box of `dialogFill` (its nearest positioned ancestor), which is why this ignores `dialogFill`'s
// own `1.25rem` flex padding rather than needing to subtract it.
export const closedIcon = style({
  position: 'absolute',
  top: '0.875rem',
  left: '0.875rem',
  width: '1.25rem',
  height: '1.25rem',
  color: themeVars.color.primaryContrast,
  pointerEvents: 'none',
  opacity: 1,
  transition: `opacity ${CONTACT_WIDGET_TRANSITION_MS}ms ease`,
  selectors: {
    // Ancestor-state selector, not `&[data-open]` — `data-open` is set on `dialogFill` itself,
    // this element is its child.
    '[data-open="true"] &': {
      opacity: 0,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
  },
});

// Opened via `.showModal()`, not the `open` attribute — the attribute alone gives a non-modal
// dialog with no focus trap, no top layer, no `::backdrop`. Asked for directly, after the
// earlier non-modal "chat widget" design: *"Can we use native dialog with backdrop for contact
// widget? ... Use native dialog just remember that morphing behavior should remain."* So this
// keeps every bit of the grow-from-the-corner animation — `width`/`height` transition directly
// to `dialogFill`'s own natural size, from whatever `.trigger`'s own measured rect was — just
// carried by this element instead of `.trigger`, since growing it is now this element's job. See
// ContactWidget/AGENTS.md.
//
// No border/padding/background of its own — `dialogFill` (below) is a normal, statically-sized
// child (not stretched to match this element), so this element's own `overflow: hidden`,
// combined with its animating `width`/`height`, naturally clips/reveals whichever portion of
// `dialogFill` currently overlaps it. That's the same thing the old `clip-path` trick simulated
// for a *sibling* element — here `dialogFill` is a real descendant, so plain `overflow: hidden`
// does it for free.
//
// `top`/`left` explicitly `auto`: the native `dialog:modal` UA stylesheet sets `inset: 0`, and
// this only overrides `bottom`/`right` — without resetting the other two, they're still `0` and
// "over-constrained" (all four insets set, plus an explicit `width`/`height`) resolves in favor
// of `top`/`left`, anchoring this at the viewport's top-left corner instead. Confirmed live with
// an isolated test page before writing this.
//
// `width`/`height` is the *only* *transitioning* property declared here, same reasoning
// `.trigger` used to document for itself: WebKit defers paint-only transitions (`border-radius`,
// `background-color`, `box-shadow`) declared on the same element as a layout-affecting one
// (`width`/`height`) until the layout one finishes, then plays them out afterwards, instead of
// running them concurrently like Chrome/Firefox do. `dialogFill` (below) exists to dodge that,
// the same way `triggerFill` used to.
//
// `borderRadius` and `border` below are *not* in that `transition` list — they're flat, constant
// values, so there's nothing for WebKit to defer. Both are load-bearing, for the same root cause:
// `dialogFill` never resizes (it sits at its full natural size the entire time; this element's
// own growing box just reveals more or less of it), and this element is anchored at `bottom`/
// `right` (the fixed corner) while `dialogFill` sits flush at this element's *top-left* (the
// moving corner, since `top`/`left` recede as width/height grow). That means `dialogFill`'s real
// top edge and real left edge always coincide with this element's own top/left edges, at every
// size — but its real *bottom* and *right* edges are 380×388 away from that moving point, i.e.
// almost always past this element's own bottom/right edges during the grow. Two visible
// consequences, confirmed live with mid-grow screenshots:
// - without `borderRadius` here, only the top-left corner is ever a real (rounded) corner of
//   `dialogFill` — the other three are arbitrary clip-cuts through its flat interior, with no
//   rounding, which reads as the panel *sliding out from the corner* rather than growing
// - without `border` here, the same thing happens to the stroke: the top and left edges show
//   `dialogFill`'s real 2px border, but the bottom and right edges cut through its interior,
//   nowhere near its actual bordered edge, so they show no stroke at all until the box reaches
//   its full open size and every edge finally coincides with a real one
// Putting both on *this* element instead fixes it the same way: a border/radius declared on the
// box that's actually resizing always traces that box's current geometry, every frame, with no
// transition needed for it to look right at any size — unlike `dialogFill`'s matching values,
// which are only ever correct relative to its own unmoving 380×388 rectangle.
export const dialogShell = style({
  position: 'fixed',
  top: 'auto',
  left: 'auto',
  bottom: `calc(1.5rem + ${safeArea.safeAreaBottom})`,
  right: `calc(1.5rem + ${safeArea.safeAreaRight})`,
  margin: 0,
  border: `${dialogShellBorderWidthPx}px solid ${themeVars.color.primary}`,
  padding: 0,
  backgroundColor: 'transparent',
  borderRadius: '0.75rem',
  overflow: 'hidden',
  maxWidth: 'calc(100vw - 2rem)',
  maxHeight: 'calc(100vh - 2rem)',
  willChange: 'width, height',
  contain: 'layout paint',
  transition: `width ${CONTACT_WIDGET_TRANSITION_MS}ms ease, height ${CONTACT_WIDGET_TRANSITION_MS}ms ease`,
  '::backdrop': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0,
    transition: `opacity ${CONTACT_WIDGET_TRANSITION_MS}ms ease-out`,
  },
  selectors: {
    '&:modal::backdrop': {
      opacity: 1,
    },
    // Higher specificity than `&:modal::backdrop` alone, so the close fade can win while still
    // modal — native `close()` isn't called until this finishes, see ContactWidget.tsx.
    '&:modal[data-closing="true"]::backdrop': {
      opacity: 0,
    },
  },
  // Without this, `::backdrop` is created *already* matching `&:modal::backdrop` (opacity 1) on
  // its very first style pass — `showModal()` makes the dialog modal and the backdrop exist in
  // the same synchronous step, so there's no earlier frame where the browser painted it at
  // opacity 0 for the transition to animate away from. Confirmed live: without this, the backdrop
  // simply appeared at full opacity with no fade at all. `@starting-style` is exactly the
  // "declare what to transition *from* the first time this starts matching" mechanism CSS
  // provides for newly-inserted elements/pseudo-elements — `Dialog`'s own backdrop already
  // established this same fix, see Dialog/styles.css.ts.
  '@starting-style': {
    selectors: {
      '&:modal::backdrop': {
        opacity: 0,
      },
    },
  },
  '@media': {
    [mobileBreakpoint]: {
      bottom: `calc(1rem + ${safeArea.safeAreaBottom})`,
      right: `calc(1rem + ${safeArea.safeAreaRight})`,
    },
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
      '::backdrop': {
        transitionDuration: '0s',
      },
    },
  },
});

// The fill, shadow, and all the real content live here, at this element's own constant natural
// size, *never* resized to match `dialogShell`'s current (animating) size. `dialogShell`'s own
// `overflow: hidden` does the rest: as it grows/shrinks, it simply reveals/hides more or less of
// this element, which is why this needs no dynamic sizing logic of its own at all.
//
// No `border` of its own — moved to `dialogShell` (see its own doc comment for why: a border
// declared on *this*, static-sized element is only ever correct relative to its own unmoving
// rectangle, which is wrong on two of its four edges for almost the entire grow/shrink. `border`
// on `dialogShell` instead always traces the box that's actually resizing. `borderRadius` stays
// here too (also `0.75rem`, also constant) for the same reason that one has to match: a clip
// radius and a fill radius that disagree just fight, and the smaller one silently wins. Unlike
// the old `triggerFill`, this is a real ancestor of the chat composer's `<input>`/button now (a
// native `<dialog>` isn't a `<button>`, so there's no HTML-nesting constraint stopping that),
// not a purely decorative layer — its own `overflow: hidden` clips its *own* children (the chat
// log, bubbles near an edge) to its rounded corners, separately from `dialogShell`'s clipping of
// this element as a whole.
//
// `position: relative` so it's the containing block for `.closeButton` (`top`/`right`
// `position: absolute`) — without it, the nearest positioned ancestor is `dialogShell` instead,
// which has no padding of its own, so the close button ends up closer to the panel's outer edge
// than intended and winds up underneath the heading's own box. Found live: Playwright reported
// the heading intercepting every click aimed at the close button's expected coordinates.
export const dialogFill = style({
  position: 'relative',
  width: '380px',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1.25rem',
  overflow: 'hidden',
  color: themeVars.color.text,
  borderRadius: '0.75rem',
  backgroundColor: themeVars.color.primary,
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
  transition: [
    `background-color ${CONTACT_WIDGET_TRANSITION_MS}ms ease`,
    `box-shadow ${CONTACT_WIDGET_TRANSITION_MS}ms ease`,
  ].join(', '),
  selectors: {
    '&[data-open="true"]': {
      backgroundColor: themeVars.color.surface,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
    },
  },
  '@media': {
    [mobileBreakpoint]: {
      // Matches `dialogShell`'s own mobile `bottom`/`right` (`1rem` + safe area) on both sides —
      // this element's own `width` is what determines `dialogShell`'s natural (shrink-to-fit)
      // size. The trailing `- {2 * borderWidth}px` subtracts `dialogShell`'s own left+right
      // border (added when `border` moved there — see its doc comment) — without it, this
      // element was exactly `2 * dialogShellBorderWidthPx` too wide for `dialogShell`'s capped
      // content box (`maxWidth: calc(100vw - 2rem)` is a *border-box* limit), overflowing into
      // `dialogShell`'s own `overflow: hidden` and clipping whatever sat near the right edge
      // (the Send button, at narrow viewports). Confirmed live at a 458px viewport before fixing:
      // `dialogShell.clientWidth` (422, content box) vs. this element's actual computed width
      // (426) — a 4px gap, exactly `2 * dialogShellBorderWidthPx`.
      width: `calc(100vw - 2rem - ${safeArea.safeAreaLeft} - ${safeArea.safeAreaRight} - ${2 * dialogShellBorderWidthPx}px)`,
    },
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
  },
});

// The chat content (close button, title, log, composer) stays `opacity: 0` until `dialogShell`
// has actually finished growing — real chat UI squeezed into a tiny box would look wrong. Scoped
// to this wrapper, not `dialogFill` itself, so `dialogFill`'s own border/background/radius
// crossfade (which should be visible from the very first frame) isn't also hidden by the same
// rule. No sizing logic of its own — fills `dialogFill`'s own content-box, which already has the
// right size.
//
// `.closeButton` is a child of *this*, not a sibling sitting directly in `dialogFill` — it used
// to be the latter, which meant it rendered at full opacity from the very first frame while
// everything else here was still invisible, so the close "×" visibly popped in well before the
// title/chat faded in once the grow settled. Moving it inside this wrapper makes it fade in with
// everything else, as one cohesive reveal. `.closeButton`'s own `position: absolute` still
// resolves against `dialogFill` (the nearest *positioned* ancestor), not this element — CSS
// containing-block lookup skips unpositioned ancestors regardless of DOM nesting, so moving it
// here doesn't change where it's actually placed.
export const panelContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  opacity: 0,
  transition: `opacity ${CONTACT_WIDGET_CONTENT_TRANSITION_MS}ms ease`,
  selectors: {
    '&[data-visible="true"]': {
      opacity: 1,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
  },
});

// Room for `.closeButton` (absolutely positioned, top-right of `dialogFill`) so the title text
// never runs underneath it.
export const panelTitle = style({
  margin: 0,
  paddingRight: '2rem',
});

// Positioned relative to `dialogFill` (the nearest positioned ancestor), same `top`/`right`/
// size/hover convention `Dialog`'s own `closeButton` already established.
export const closeButton = style({
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  width: '2rem',
  height: '2rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25rem',
  lineHeight: 1,
  border: 'none',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: themeVars.color.textSecondary,
  selectors: {
    '&:hover': {
      backgroundColor: themeVars.color.surfaceHover,
    },
  },
});

export const chat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
});

// Fixed height, not "grows with content" — a live chat log that kept growing the dialog itself
// taller with every message would also keep moving the composer/send button, which is the one
// thing that must stay in a stable spot while typing. Scrolls internally instead; see
// ContactWidget/AGENTS.md.
export const log = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  height: '16rem',
  overflowY: 'auto',
  padding: '0.25rem',
});

const bubble = {
  margin: 0,
  padding: '0.5rem 0.75rem',
  borderRadius: '0.75rem',
  maxWidth: '80%',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
} as const;

export const messageAgent = style({
  ...bubble,
  alignSelf: 'flex-start',
  backgroundColor: themeVars.color.surfaceHover,
  color: themeVars.color.text,
});

// `primary`/`primaryContrast` — the same pair `Link/AGENTS.md` already verified AA-safe
// (5.17:1), not a new, unverified color choice for this bubble.
export const messageUser = style({
  ...bubble,
  alignSelf: 'flex-end',
  backgroundColor: themeVars.color.primary,
  color: themeVars.color.primaryContrast,
});

export const typingIndicator = style({
  ...bubble,
  alignSelf: 'flex-start',
  backgroundColor: themeVars.color.surfaceHover,
  display: 'flex',
  gap: '0.25rem',
  alignItems: 'center',
});

const pulse = keyframes({
  '0%, 80%, 100%': { opacity: 0.3 },
  '40%': { opacity: 1 },
});

export const typingDot = style({
  width: '0.375rem',
  height: '0.375rem',
  borderRadius: '50%',
  backgroundColor: themeVars.color.textSecondary,
  animation: `${pulse} 1.2s ease-in-out infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  selectors: {
    '&:nth-child(2)': { animationDelay: '0.15s' },
    '&:nth-child(3)': { animationDelay: '0.3s' },
  },
});

export const composer = style({
  display: 'flex',
  gap: '0.5rem',
});

export const messageInput = style({
  flex: 1,
  padding: '0.5rem',
  border: `1px solid ${themeVars.color.border}`,
  borderRadius: '0.375rem',
  fontSize: FONT_SIZE_NORMAL,
  color: themeVars.color.text,
  backgroundColor: themeVars.color.surface,
});
