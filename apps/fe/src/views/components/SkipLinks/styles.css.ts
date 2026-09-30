import { style } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

// Off-screen via position, not visibility/display — either would drop every link inside from
// the tab order. `:focus-within` (not `:focus`) keeps the whole cluster visible while tabbing
// from one link to the next, instead of hiding between items.
export const container = style({
  position: 'fixed',
  top: '-3rem',
  left: '0.5rem',
  zIndex: 100,
  display: 'flex',
  gap: '0.5rem',
  transition: 'top 150ms ease',
  selectors: {
    '&:focus-within': {
      top: '0.5rem',
    },
  },
});

export const link = style({
  padding: '0.5rem 1rem',
  borderRadius: '0.25rem',
  backgroundColor: themeVars.color.primary,
  color: themeVars.color.primaryContrast,
  fontWeight: 600,
  textDecoration: 'none',
});
