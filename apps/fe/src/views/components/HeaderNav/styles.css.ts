import { style } from '@vanilla-extract/css';

import { belowBreakpoint } from '@/assets/styles/responsive/breakpoints';

export const headerLeft = style({
  display: 'flex',
  gap: '1.5rem',
  alignItems: 'center',
});

// Hidden below `sm`, not moved into `MobileNav`'s panel — a brand name that's only visible after
// opening the menu doesn't orient anyone; the hamburger button alone is the recognized affordance
// at this width. Still present (`display: none`, not removed from the DOM) so it's one class to
// drop, not a conditional render, if a future icon-only logo needs the same treatment.
export const brand = style({
  '@media': {
    [belowBreakpoint('sm')]: {
      display: 'none',
    },
  },
});

// No min-width: switching locale changes "Home"/"News"' own width, which shifts `headerRight`
// since `header` is `justify-content: space-between` — accepted rather than fixed.
// Vertical padding: measured 18.34px tall with none at all — WCAG 2.5.8 / axe-core's
// `target-size` rule requires 24px. `0.4rem` top/bottom clears it with margin (verified live).
export const navLink = style({
  textAlign: 'center',
  padding: '0.4rem 0',
});
