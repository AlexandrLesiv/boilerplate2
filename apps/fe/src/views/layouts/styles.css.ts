import { style } from '@vanilla-extract/css';

import { belowBreakpoint } from '@/assets/styles/responsive/breakpoints';
import * as safeArea from '@/assets/styles/safe-area.css';
import { themeVars } from '@/assets/styles/themes.css';

// `position: relative` — the containing block both `MobileNav`'s `nav` and `OfflineStatus`
// position themselves against (`position: absolute; left: 0; right: 0; top: 100%`), so each
// spans this element's own width and sits flush below it without participating in page flow (no
// layout shift when either appears — see MobileNav/AGENTS.md and OfflineStatus/AGENTS.md).
export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1.5rem',
  position: 'relative',
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
