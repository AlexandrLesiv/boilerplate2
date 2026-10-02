import { keyframes, style } from '@vanilla-extract/css';

import { belowBreakpoint } from '@/assets/styles/responsive/breakpoints';
import * as safeArea from '@/assets/styles/safe-area.css';
import { FONT_SIZE_NORMAL, themeVars } from '@/assets/styles/themes.css';

const mobileBreakpoint = belowBreakpoint('sm');

// Fixed, not sticky — same reasoning as `SkipLinks`: this floats over page content everywhere,
// not just within one scroll container. `zIndex: 10` is well under `SkipLinks`' `100` (the only
// other fixed-position element in the app shell) — nothing else uses an explicit `zIndex`, so
// there's no third value to stay clear of. Native `<dialog>`'s own top-layer promotion means
// `Dialog`/`Lightbox` never compete with this regardless of the number — see Dialog/AGENTS.md.
export const trigger = style({
  position: 'fixed',
  bottom: `calc(1.5rem + ${safeArea.safeAreaBottom})`,
  right: `calc(1.5rem + ${safeArea.safeAreaRight})`,
  zIndex: 10,
  borderRadius: '999px',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
  '@media': {
    [mobileBreakpoint]: {
      bottom: `calc(1rem + ${safeArea.safeAreaBottom})`,
      right: `calc(1rem + ${safeArea.safeAreaRight})`,
    },
  },
});

export const triggerIcon = style({
  width: '1.125rem',
  height: '1.125rem',
  marginRight: '0.375rem',
  flexShrink: 0,
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
