import { style } from '@vanilla-extract/css';

import { belowBreakpoint } from '@/assets/styles/responsive/breakpoints';
import * as safeArea from '@/assets/styles/safe-area.css';
import { themeVars } from '@/assets/styles/themes.css';

import { DIALOG_TRANSITION_MS as transitionMs } from './constants';

// Full-screen takeover below `sm` instead of a floating card — see Dialog/AGENTS.md.
const mobileBreakpoint = belowBreakpoint('sm');

// `margin: auto` restates the native `dialog:modal` UA default, which the app-wide `* { margin: 0 }`
// reset (global.css.ts) overrides.
export const dialog = style({
  // Overrides the app shell's `visibility: hidden` below `sm` (layouts/styles.css.ts). See
  // Dialog/AGENTS.md ("mobile: full-screen takeover").
  visibility: 'visible',
  margin: 'auto',
  border: 'none',
  borderRadius: '0.5rem',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
  backgroundColor: themeVars.color.surface,
  color: themeVars.color.text,
  width: '90vw',
  maxWidth: '420px',
  position: 'relative',
  opacity: 0,
  transform: 'scale(0.96)',
  transition: [
    `opacity ${transitionMs}ms ease-out`,
    `transform ${transitionMs}ms ease-out`,
    `overlay ${transitionMs}ms ease-out allow-discrete`,
    `display ${transitionMs}ms ease-out allow-discrete`,
  ].join(', '),
  '::backdrop': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0,
    transition: [`opacity ${transitionMs}ms ease-out`, `overlay ${transitionMs}ms ease-out allow-discrete`].join(', '),
  },
  selectors: {
    '&:modal': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '&:modal::backdrop': {
      opacity: 1,
    },
  },
  '@starting-style': {
    selectors: {
      '&:modal': {
        opacity: 0,
        transform: 'scale(0.96)',
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
    },
    [mobileBreakpoint]: {
      margin: 0,
      inset: 0,
      width: '100%',
      right: 'auto',
      height: 'auto',
      maxWidth: 'none',
      maxHeight: 'none',
      borderRadius: 0,
    },
  },
});

// Padding lives here, not on `.dialog` — a click inside it then always lands on this element (or a
// descendant), never on `.dialog` itself, which is what keeps `handleBackdropClick` (Dialog.tsx) a
// plain `event.target === ref` check. `height: '100%'` matters on mobile specifically: without it,
// a short form wouldn't fill `.dialog`'s full-screen stretch, leaving dead space that's uncovered
// `.dialog` again. See Dialog/AGENTS.md ("Backdrop click detection").
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

export const title = style({
  marginBottom: '1rem',
  fontSize: '1.25rem',
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
