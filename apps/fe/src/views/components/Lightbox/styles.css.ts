import { style } from '@vanilla-extract/css';

import * as safeArea from '@/assets/styles/safe-area.css';

import { LIGHTBOX_TRANSITION_MS as transitionMs } from './constants';

// Chrome (buttons, counter, caption) is always light-on-black, regardless of light/dark theme —
// unlike Dialog's card, this overlay's backdrop is always near-black, so `themeVars.color.text`
// (which flips for light mode) would go invisible against it.
const chromeColor = 'rgba(255, 255, 255, 0.92)';
const chromeHoverBackground = 'rgba(255, 255, 255, 0.12)';

// Always full-screen — unlike Dialog, there's no "floating card" state at any viewport width.
// Darkens via a `background-color` transition, not `opacity` — `opacity` on `.dialog` would
// fade its *children* too (the image inside `.content`), compositing with the FLIP scale into a
// fade-plus-grow look. `background-color` only affects the box's own paint, leaving descendants
// at full opacity throughout — the image's only visible motion is the FLIP transform
// (Lightbox.tsx), not this CSS transition. See Lightbox/AGENTS.md.
export const dialog = style({
  position: 'fixed',
  inset: 0,
  margin: 0,
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  maxHeight: 'none',
  border: 'none',
  padding: 0,
  // Darkens the dialog's own box, not just `::backdrop` — at `inset: 0` the box covers the whole
  // viewport, so `::backdrop` sits entirely behind it and never shows. A `transparent` box here
  // was a real bug caught by an automated contrast check: with nothing dark actually rendered,
  // the caption text was measured against the page behind it, not this overlay.
  backgroundColor: 'transparent',
  // `background-color` only — no `overlay`/`display` transition. An earlier version animated
  // those too (`allow-discrete` + `@starting-style`) to keep the dialog rendered for the close
  // transition's duration instead of vanishing the instant `close()` runs. That depends on
  // engines deferring the dialog's actual top-layer removal, which isn't consistent enough:
  // reported live jumping straight to the end state on close in Firefox and Safari. Lightbox.tsx
  // now drives the close fade itself via `data-closing` and only calls native `close()` once it
  // (and the content FLIP) have actually finished, so nothing needs to be kept alive by a CSS
  // feature with uneven engine support — see Lightbox/AGENTS.md.
  transition: `background-color ${transitionMs}ms ease-out`,
  // `::backdrop` fades on the *same* schedule as the box itself, not statically dark — without
  // this, `::backdrop` stayed solid `#0a0a0a` the entire time, which sits directly behind the box
  // in top-layer paint order: as the box's own `background-color` fades to transparent during
  // `data-closing`, what becomes visible through it is this still-fully-opaque backdrop, not the
  // page — so the "close fade" was invisible in practice, masked by its own backdrop, until the
  // instant `close()` actually ran and both were removed together with no fade at all.
  '::backdrop': {
    backgroundColor: 'transparent',
    transition: `background-color ${transitionMs}ms ease-out`,
  },
  selectors: {
    // Fully opaque, not translucent — reads correctly on screen either way, but axe's static
    // contrast check can't composite alpha < 1 against whatever is behind it and reports a
    // false-positive violation against the page's own background instead. Opaque sidesteps that.
    '&:modal': { backgroundColor: '#0a0a0a' },
    '&:modal::backdrop': { backgroundColor: '#0a0a0a' },
    // Higher specificity than `&:modal` alone, so the close fade can win while still modal —
    // native `close()` isn't called until this (and any content FLIP) finishes, see Lightbox.tsx.
    '&:modal[data-closing="true"]': { backgroundColor: 'transparent' },
    '&:modal[data-closing="true"]::backdrop': { backgroundColor: 'transparent' },
  },
  '@starting-style': {
    selectors: {
      '&:modal': { backgroundColor: 'transparent' },
      '&:modal::backdrop': { backgroundColor: 'transparent' },
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
      '::backdrop': {
        transitionDuration: '0s',
      },
    },
  },
});

// Split in two, deliberately: `content` (padding, centering, never transformed) and
// `contentInner` (zero padding, the actual FLIP target in Lightbox.tsx). `getBoundingClientRect()`
// reports an element's *border box* (padding included), but a `width/height: 100%` child sizes
// against its *content box* (padding excluded) — so transforming `content` directly (as an
// earlier version did) scaled a box that was always ~2rem+safe-area bigger on each axis than what
// its child actually filled, a mismatch that held throughout the entire animation, not just the
// first frame. Reported live and confirmed by checking the child's rect against the parent's.
// `contentInner` has no padding of its own, so its border box exactly equals what its child
// occupies — nothing in between the two to create the same gap again.
export const content = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  paddingTop: `calc(2rem + ${safeArea.safeAreaTop})`,
  paddingRight: `calc(2rem + ${safeArea.safeAreaRight})`,
  paddingBottom: `calc(2rem + ${safeArea.safeAreaBottom})`,
  paddingLeft: `calc(2rem + ${safeArea.safeAreaLeft})`,
  // Query container, not an aspect-ratio of its own — `content` stays whatever shape the
  // available (padded) space happens to be. `contentInner`'s `cqw`/`cqh` below resolve against
  // *this* box's content-box size, which is what makes the contain-fit math possible without JS
  // re-measuring on every resize.
  containerType: 'size',
});

// Sized to the largest box matching `--lightbox-ratio` that fits inside `content`'s available
// space — the same "contain" math `object-fit` does for a replaced element, applied here to a
// plain box via container query units, because `contentInner` isn't a replaced element and has
// no `object-fit` of its own to lean on. `--lightbox-ratio` is set imperatively in Lightbox.tsx
// from the actual clicked trigger's own aspect ratio — not hardcoded here, since Lightbox can't
// assume what shape a consumer's thumbnails are. See Lightbox/AGENTS.md: without this, `from`
// (the trigger) and `to` (this element's old plain 100%/100% sizing) had *different* aspect
// ratios whenever the viewport's own shape didn't match the trigger's, which made a uniform FLIP
// scale land short of the trigger's exact size on one axis — and a non-uniform scale distort the
// photo instead. Matching the ratio exactly removes the conflict instead of trading one for the
// other.
export const contentInner = style({
  width: 'min(100cqw, calc(100cqh * var(--lightbox-ratio, 1.7778)))',
  height: 'min(100cqh, calc(100cqw / var(--lightbox-ratio, 1.7778)))',
});

export const caption = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: `calc(1.5rem + ${safeArea.safeAreaBottom})`,
  margin: 0,
  padding: '0 1rem',
  textAlign: 'center',
  color: chromeColor,
});

const iconButton = style({
  position: 'absolute',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  border: 'none',
  borderRadius: '9999px',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: chromeColor,
  fontSize: '1.75rem',
  lineHeight: 1,
  selectors: {
    '&:hover': { backgroundColor: chromeHoverBackground },
  },
});

export const closeButton = style([
  iconButton,
  {
    top: `calc(0.5rem + ${safeArea.safeAreaTop})`,
    right: `calc(0.5rem + ${safeArea.safeAreaRight})`,
  },
]);

export const prevButton = style([
  iconButton,
  {
    top: '50%',
    left: `calc(0.5rem + ${safeArea.safeAreaLeft})`,
    transform: 'translateY(-50%)',
  },
]);

export const nextButton = style([
  iconButton,
  {
    top: '50%',
    right: `calc(0.5rem + ${safeArea.safeAreaRight})`,
    transform: 'translateY(-50%)',
  },
]);

export const counter = style({
  position: 'absolute',
  top: `calc(0.5rem + ${safeArea.safeAreaTop})`,
  left: '50%',
  transform: 'translateX(-50%)',
  margin: 0,
  color: chromeColor,
  fontSize: '0.875rem',
});
