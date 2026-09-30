import { style } from '@vanilla-extract/css';

import { belowBreakpoint } from '@/assets/styles/responsive/breakpoints';
import * as safeArea from '@/assets/styles/safe-area.css';
import { themeVars } from '@/assets/styles/themes.css';

// Hides the app shell behind a mobile full-screen dialog — `visibility`, not `display: none`,
// since the latter would take the top-layer-promoted dialog down with it. See Dialog/AGENTS.md.
export const appShell = style({
  '@media': {
    [belowBreakpoint('sm')]: {
      selectors: {
        '&:has(dialog[open])': {
          visibility: 'hidden',
        },
      },
    },
  },
});

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1.5rem',
  paddingTop: `calc(1rem + ${safeArea.safeAreaTop})`,
  paddingRight: `calc(1rem + ${safeArea.safeAreaRight})`,
  paddingBottom: '1rem',
  paddingLeft: `calc(1rem + ${safeArea.safeAreaLeft})`,
  borderBottom: `1px solid ${themeVars.color.border}`,
});

export const headerLeft = style({
  display: 'flex',
  gap: '1.5rem',
  alignItems: 'center',
});

export const nav = style({
  display: 'flex',
  gap: '1rem',
});

// No min-width: switching locale changes "Home"/"News"' own width, which shifts `headerRight`
// since `header` is `justify-content: space-between` — accepted rather than fixed.
// Vertical padding: measured 18.34px tall with none at all — WCAG 2.5.8 / axe-core's
// `target-size` rule requires 24px. `0.4rem` top/bottom clears it with margin (verified live).
export const navLink = style({
  textAlign: 'center',
  padding: '0.4rem 0',
});

// A single flex child alongside `headerLeft`, so `header`'s `space-between` pushes this whole
// group to the right edge as one unit instead of spreading each of its children out evenly.
export const headerRight = style({
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
});

export const main = style({
  paddingTop: '2rem',
  paddingRight: `calc(2rem + ${safeArea.safeAreaRight})`,
  paddingBottom: `calc(2rem + ${safeArea.safeAreaBottom})`,
  paddingLeft: `calc(2rem + ${safeArea.safeAreaLeft})`,
});
