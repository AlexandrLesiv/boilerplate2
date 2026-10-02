import { style } from '@vanilla-extract/css';

import { belowBreakpoint } from '@/assets/styles/responsive/breakpoints';
import * as safeArea from '@/assets/styles/safe-area.css';
import { themeVars } from '@/assets/styles/themes.css';

import { DIALOG_TRANSITION_MS as transitionMs } from './constants';

// A bottom sheet below `sm` instead of a floating card — see Dialog/AGENTS.md.
const mobileBreakpoint = belowBreakpoint('sm');

// The pop's pivot point — `50%` (the box's own center) unless `Dialog.tsx` points it at a
// trigger element's position, in which case it overrides both custom properties with a
// `calc(50% + <offset>px)` pair. Same "per-instance runtime value as a custom property" pattern
// `Lightbox` uses for `--lightbox-ratio` — see Dialog/AGENTS.md.
const originX = 'var(--dialog-origin-x, 50%)';
const originY = 'var(--dialog-origin-y, 50%)';
// Much smaller than a typical subtle modal pop on purpose. With the pivot shifted toward a
// trigger element (see above), the apparent start position is `center + (pivot - center) * (1 -
// scale)` — at the previous `0.96` that's a ~4% shift, imperceptible regardless of where the
// pivot sits. At `0.15` it's 85% of the way to the trigger, *and* the box itself starts small
// enough (≈15% of its settled size) to plausibly be mistaken for the trigger's own footprint —
// both the position and the size need to read as "this came from the button," not just one.
const closedScale = 'scale(0.15)';
// Every "closed" state (base, `@starting-style`, `[data-closing]`) reads this variable rather
// than `closedScale` directly, so the single mobile media-query override below (`translateY`
// instead of `scale`) automatically applies everywhere a closed transform is used, instead of
// needing four separate copies kept in sync. The settled `:modal` state stays a bare `scale(1)`
// on both desktop and mobile — that's just the identity matrix, numerically identical to
// `translateY(0)`, so one end-state value works for either starting transform. See
// Dialog/AGENTS.md ("Mobile uses a slide, not a scale").
const closedTransform = 'var(--dialog-closed-transform)';
// Same "read through a variable so one mobile override reaches every closed state" shape as
// `closedTransform` — see Dialog/AGENTS.md ("Mobile dialog stays opaque — no fade, only the
// slide"). Desktop still fades in from fully transparent; mobile never fades at all.
const closedOpacity = 'var(--dialog-closed-opacity)';

// `margin: auto` restates the native `dialog:modal` UA default, which the app-wide `* { margin: 0 }`
// reset (global.css.ts) overrides.
export const dialog = style({
  margin: 'auto',
  border: 'none',
  borderRadius: '0.5rem',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
  backgroundColor: themeVars.color.surface,
  color: themeVars.color.text,
  width: '90vw',
  maxWidth: '420px',
  position: 'relative',
  opacity: closedOpacity,
  transform: closedTransform,
  transformOrigin: `${originX} ${originY}`,
  vars: {
    '--dialog-closed-transform': closedScale,
    '--dialog-closed-opacity': '0',
  },
  // `opacity`/`transform` only — no `overlay`/`display` `allow-discrete` transition. An earlier
  // version animated those too, to keep the dialog rendered for the close transition's duration
  // instead of vanishing the instant `close()` runs. That depends on engines deferring the
  // dialog's actual top-layer removal, which isn't consistent enough: reported live snapping
  // straight to closed with no animation in Firefox and Safari (worked in Chrome). `Dialog.tsx`
  // now drives the close fade itself via `data-closing` and only calls native `close()` once it
  // has actually finished, so nothing needs to be kept alive by a CSS feature with uneven engine
  // support — see Dialog/AGENTS.md and Lightbox/AGENTS.md (which hit the identical bug first).
  transition: [`opacity ${transitionMs}ms ease-out`, `transform ${transitionMs}ms ease-out`].join(', '),
  '::backdrop': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0,
    transition: `opacity ${transitionMs}ms ease-out`,
  },
  selectors: {
    '&:modal': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '&:modal::backdrop': {
      opacity: 1,
    },
    // Higher specificity than `&:modal` alone, so the close fade/scale can win while still
    // modal — native `close()` isn't called until this finishes, see Dialog.tsx.
    '&:modal[data-closing="true"]': {
      opacity: closedOpacity,
      transform: closedTransform,
    },
    '&:modal[data-closing="true"]::backdrop': {
      opacity: 0,
    },
  },
  '@starting-style': {
    selectors: {
      '&:modal': {
        opacity: closedOpacity,
        transform: closedTransform,
      },
      '&:modal::backdrop': {
        opacity: 0,
      },
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
      transform: 'none',
      selectors: {
        '&:modal': {
          transform: 'none',
        },
      },
      // Not inherited from the parent `@media` block above — vanilla-extract only zeroes this
      // rule's own top-level `transitionDuration`, not a nested pseudo-element's separate
      // `transition`. Without this, `::backdrop`'s fade kept its full duration under reduced
      // motion even though `waitForCloseTransition` (Dialog.tsx) resolves immediately for it,
      // same gap Lightbox/AGENTS.md documents for its own backdrop.
      '::backdrop': {
        transitionDuration: '0s',
      },
    },
    [mobileBreakpoint]: {
      margin: 0,
      // `marginTop: 'auto'`, not `top: 'auto'` — this box must keep `inset: 0` (top *and* bottom
      // both `0`) to stay in the one positioning shape that actually animates `transform`
      // correctly on this element; see Dialog/AGENTS.md ("Getting a bottom-anchored box to
      // actually animate"). The auto top margin is what pushes a *shorter-than-stretch* box
      // (capped by `max-height` below) down to the bottom edge instead of letting it stretch.
      marginTop: 'auto',
      inset: 0,
      width: '100%',
      height: 'auto',
      maxWidth: 'none',
      maxHeight: '85vh',
      borderRadius: 0,
      borderTopLeftRadius: '1rem',
      borderTopRightRadius: '1rem',
      vars: {
        '--dialog-closed-transform': 'translateY(100vh)',
        '--dialog-closed-opacity': '1',
      },
    },
  },
});

// Padding lives here, not on `.dialog` — a click inside it then always lands on this element (or a
// descendant), never on `.dialog` itself, which is what keeps `handleBackdropClick` (Dialog.tsx) a
// plain `event.target === ref` check. `height: '100%'` fills whatever height `.dialog` itself ends
// up at — content-sized up to its `max-height` on mobile (see Dialog/AGENTS.md), always
// `auto`-driven on desktop — so this is what makes `overflowY: 'auto'` below actually able to
// scroll once content exceeds that cap, rather than just letting `.dialog` grow past it.
export const content = style({
  height: '100%',
  padding: '1.5rem',
  paddingRight: '2.5rem',
  '@media': {
    [mobileBreakpoint]: {
      paddingTop: `calc(1.5rem + ${safeArea.safeAreaTop})`,
      paddingRight: `calc(2.5rem + ${safeArea.safeAreaRight})`,
      paddingBottom: `calc(1.5rem + ${safeArea.safeAreaBottom})`,
      paddingLeft: `calc(1.5rem + ${safeArea.safeAreaLeft})`,
      overflowY: 'auto',
    },
  },
});

// `fontSize` no longer lives here — `Heading`'s own `size="md"` (Dialog.tsx) sets it now.
export const title = style({
  marginBottom: '1rem',
});

export const closeButton = style({
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  width: '2.75rem',
  height: '2.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
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
  '@media': {
    [mobileBreakpoint]: {
      top: `calc(0.5rem + ${safeArea.safeAreaTop})`,
      right: `calc(0.5rem + ${safeArea.safeAreaRight})`,
    },
  },
});
