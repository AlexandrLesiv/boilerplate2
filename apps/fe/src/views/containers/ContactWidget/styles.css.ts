import { keyframes, style } from '@vanilla-extract/css';

import { belowBreakpoint } from '@/assets/styles/responsive/breakpoints';
import * as safeArea from '@/assets/styles/safe-area.css';
import { FONT_SIZE_NORMAL, themeVars } from '@/assets/styles/themes.css';
import { zIndex } from '@/assets/styles/zIndex';

import { CONTACT_WIDGET_CONTENT_TRANSITION_MS, CONTACT_WIDGET_TRANSITION_MS } from './constants';

const mobileBreakpoint = belowBreakpoint('sm');

// Fixed, not sticky — same reasoning as `SkipLinks`: this floats over page content everywhere,
// not just within one scroll container. `zIndex: 10` is well under `SkipLinks`' `100` (the only
// other fixed-position element in the app shell) — nothing else uses an explicit `zIndex`, so
// there's no third value to stay clear of. Neither this nor `.panelContent` below needs
// top-layer promotion the way `Dialog`/`Lightbox` do — this widget is deliberately non-modal —
// so a plain `z-index` is enough; see ContactWidget/AGENTS.md.
//
// This is the element that morphs — not a separate shape that merely matches its position.
// `width`/`height` start as whatever the button's own content naturally sizes it to, and
// `ContactWidget.tsx` transitions them to the panel content's measured natural size, anchored at
// this same `bottom`/`right` corner the whole time — since `top`/`left` are never set, growing
// `width`/`height` necessarily expands the box up and to the left *from* that corner, with no
// way for it to end up positioned anywhere else.
//
// `width`/`height` is the *only* transition declared here, and this element carries no border,
// background, or border-radius of its own at all — all of that (plus their crossfades) lives on
// `triggerFill` (below) instead. Confirmed live in Safari/WebKit: when a layout-affecting
// transition (`width`/`height`) and paint-only transitions (`background-color`, `box-shadow`,
// `border-radius`) are declared on the *same* element, WebKit defers the paint ones until the
// layout one finishes, then plays them out afterwards — the box stayed solid blue and square for
// the entire grow, then "white-and-round-ed-out" only once fully grown, where Chrome/Firefox run
// all of them concurrently as intended. Moving the paint transitions to a child that has no
// `width`/`height` of its own (just `inset: 0`, tracking the parent's size as a passive layout
// consequence rather than its own declared transition) fixes it in WebKit too — confirmed with an
// isolated test page before changing this file. See ContactWidget/AGENTS.md ("WebKit defers
// paint transitions bundled with a layout one").
export const trigger = style({
  position: 'fixed',
  bottom: `calc(1.5rem + ${safeArea.safeAreaBottom})`,
  right: `calc(1.5rem + ${safeArea.safeAreaRight})`,
  zIndex: zIndex.contactWidgetTrigger,
  overflow: 'hidden',
  // Icon spacing only now — the visual shape (border, fill) moved to `triggerFill`. Still needs
  // *some* `border-radius` of its own, though, even with nothing of its own painted using it:
  // `overflow: hidden` clips descendants (`triggerFill` included) to *this* element's own
  // border-radius, and with none declared here the cascade fell through to the shared `boxed`
  // look's `0.375rem` — visibly clipping `triggerFill`'s own, more generous `1rem` corners down
  // to that tighter shape. Found live, from the real rendered CSS, not from a screenshot alone:
  // `triggerFill`'s *own* `getComputedStyle().borderRadius` always correctly reported `1rem`
  // regardless, since computed style reflects a property's declared value on that element, not
  // whether an ancestor is clipping it away. Set to `1rem` — the *largest* radius `triggerFill`
  // ever reaches, not an animated match for its current one — so this clip is never tighter than
  // whatever shape is currently inside it, at any point in the grow/shrink.
  borderRadius: '1rem',
  padding: '0.875rem',
  // Safari-specific mitigation for animating `width`/`height` directly (the layout-recalc jank
  // `transform: scale()` was tried, and reverted, to avoid — see git history and the "Tried
  // `transform`" note in AGENTS.md). Neither eliminates the reflow `width`/`height` inherently
  // cause — that's unavoidable for a real layout property — but both give Safari more to work
  // with: `willChange` hints the upcoming change so it isn't discovered mid-frame, and
  // `contain: 'layout paint'` tells the engine this element's layout/paint can't affect anything
  // outside its own box, so a resize here never needs to re-check ancestors or siblings. Applied
  // statically rather than toggled on only while animating (the usual advice, to avoid leaving
  // an idle compositing layer around) — this element is tiny and always mounted, so the memory
  // cost of leaving it on is negligible, and it avoids a second piece of JS bookkeeping.
  willChange: 'width, height',
  contain: 'layout paint',
  transition: `width ${CONTACT_WIDGET_TRANSITION_MS}ms ease, height ${CONTACT_WIDGET_TRANSITION_MS}ms ease`,
  '@media': {
    [mobileBreakpoint]: {
      bottom: `calc(1rem + ${safeArea.safeAreaBottom})`,
      right: `calc(1rem + ${safeArea.safeAreaRight})`,
    },
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
  },
});

// The entire visual shape — border, radius, fill, shadow — split out from `.trigger` itself
// purely to dodge the WebKit bug documented on `.trigger` above. `inset: 0` means this element's
// size is a passive consequence of `.trigger`'s own resize, not a `width`/`height` transition of
// its own, which is what keeps `border-radius`/`background-color`/`box-shadow` running
// concurrently with the grow in WebKit instead of deferred until after. Since `.trigger` now has
// no border of its own, this element's own `inset: 0` border-box sits exactly where `.trigger`'s
// border used to be — no visual shift from moving it here. `border` stays `primary`-colored at
// every size, including closed — invisible there since it's the same hue as this element's own
// `backgroundColor`, which is what makes it read as "the button's own color" rather than a
// separate decoration; once `backgroundColor` crossfades to `surface` on open (alongside
// `border-radius` growing from the closed "small chat box" `0.75rem` to the open panel's `1rem` —
// bigger shape, bigger radius, not a single constant — found live that it mattered: *"Bigger
// elements should have bigger border radius"*), the same border becomes a visible, increasingly
// subtle-looking outline. `pointerEvents: 'none'` since it's purely decorative — `.trigger`'s own
// click handler already covers this whole area regardless.
export const triggerFill = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  border: `2px solid ${themeVars.color.primary}`,
  borderRadius: '0.75rem',
  backgroundColor: themeVars.color.primary,
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
  transition: [
    `border-radius ${CONTACT_WIDGET_TRANSITION_MS}ms ease`,
    `background-color ${CONTACT_WIDGET_TRANSITION_MS}ms ease`,
    `box-shadow ${CONTACT_WIDGET_TRANSITION_MS}ms ease`,
  ].join(', '),
  selectors: {
    [`${trigger}[data-open="true"] &`]: {
      borderRadius: '1rem',
      backgroundColor: themeVars.color.surface,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
  },
});

// Wraps the icon so it can be hidden instantly (not animated — a fade here would just show it
// bleeding through the growing shape mid-transition) the moment the trigger starts opening.
// References `trigger`'s own generated class in the selector rather than a second attribute on
// this element, since the attribute that drives it (`data-open`) only ever gets set on the
// button itself. Still a wrapper (not just styling `triggerIcon` directly) in case the icon is
// ever joined by a visible label again — see git history for the text+icon version this replaced.
// Painted after `triggerFill` in DOM order so the icon renders on top of it, not underneath.
export const triggerContent = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  selectors: {
    [`${trigger}[data-open="true"] &`]: {
      opacity: 0,
    },
  },
});

// No visible label next to it — `AppButton`'s own `aria-label` (`ContactWidget.tsx`) carries the
// accessible name instead; the icon stays `aria-hidden` regardless, same as everywhere else in
// the app, since an SVG has no accessible text of its own to contribute either way.
export const triggerIcon = style({
  width: '1.25rem',
  height: '1.25rem',
  flexShrink: 0,
});

// Positioned at the *exact same* corner/offset as `.trigger`, independently — not to visually
// match it (nothing here is measured against it), but because this is what `ContactWidget.tsx`
// measures to find out how big `.trigger` should grow: this element lays itself out at its own
// natural size (this fixed width, or edge-to-edge on mobile; height from its real content) with
// no dependency on the trigger's current size at all, and its measured rect becomes the
// trigger's transition target. `z-index` above `.trigger` so it paints on top once revealed, but
// it owns no background/border of its own — `.trigger`'s fill and border show through the parts
// of this box that aren't covered by actual content, which is what keeps the border visible
// (painting an opaque fill here, flush with `.trigger`'s edges, would paint over it). `overflow`
// /`border-radius` still need to match, though, so this element's *own* children (the chat log,
// bubbles near an edge) get clipped to the same rounded shape `.trigger` clips itself to — they
// aren't inside `.trigger`, so its own `overflow: hidden` has no effect on them.
//
// `clip-path` is the structural fix for content rendering outside `.trigger`'s current (still
// mid-grow/shrink) bounds — found live from a screenshot showing exactly that, persisting even
// after sequencing the opacity fade ahead of the shrink (a `setTimeout`/CSS-transition pair
// isn't guaranteed to resolve in the same tick). This element's own size is always its full
// natural size (380×~384), never animated — only the *visible* region of it is, via
// `clip-path: inset(...)`, computed in `ContactWidget.tsx` from the same measured rects that
// drive `.trigger`'s own `width`/`height`, transitioning over the same
// `CONTACT_WIDGET_TRANSITION_MS` so the clipped region and `.trigger`'s visual box move in
// lockstep by construction — there's no separate timer that could drift out of sync. `opacity`
// stays on its own, shorter, independent timeline — it's not what prevents the overflow
// (clip-path is), it's what avoids revealing a half-clipped, jumbled partial view of real chat
// UI while the clip region is still widening/narrowing. See ContactWidget/AGENTS.md ("Clipped to
// the trigger's own bounds, not just timed around them").
export const panelContent = style({
  position: 'fixed',
  bottom: `calc(1.5rem + ${safeArea.safeAreaBottom})`,
  right: `calc(1.5rem + ${safeArea.safeAreaRight})`,
  zIndex: zIndex.contactWidgetPanel,
  width: '380px',
  maxWidth: 'calc(100vw - 2rem)',
  maxHeight: 'calc(100vh - 2rem)',
  overflow: 'hidden',
  borderRadius: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1.25rem',
  color: themeVars.color.text,
  opacity: 0,
  clipPath: 'inset(0)',
  transition: [
    `opacity ${CONTACT_WIDGET_CONTENT_TRANSITION_MS}ms ease`,
    `clip-path ${CONTACT_WIDGET_TRANSITION_MS}ms ease`,
  ].join(', '),
  selectors: {
    '&[data-visible="true"]': {
      opacity: 1,
    },
  },
  '@media': {
    [mobileBreakpoint]: {
      bottom: `calc(1rem + ${safeArea.safeAreaBottom})`,
      right: `calc(1rem + ${safeArea.safeAreaRight})`,
      left: `calc(1rem + ${safeArea.safeAreaLeft})`,
      width: 'auto',
      maxWidth: 'none',
    },
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
  },
});

// Room for `.closeButton` (absolutely positioned, top-right of `.panelContent`) so the title
// text never runs underneath it.
export const panelTitle = style({
  margin: 0,
  paddingRight: '2rem',
});

// Positioned relative to `.panelContent` (the nearest positioned ancestor — `position: fixed`
// counts), same `top`/`right`/size/hover convention `Dialog`'s own `closeButton` already
// established. This is also the fix for the one thing growing the trigger itself cost: once
// `.panelContent` is painted on top of the fully-grown trigger, a real pointer can no longer
// reach the (now fully covered) trigger button to re-close it — see ContactWidget/AGENTS.md
// ("Real-mouse consequence").
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
