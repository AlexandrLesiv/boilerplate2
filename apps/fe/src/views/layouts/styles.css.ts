import { style } from '@vanilla-extract/css';

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

// A single flex child alongside `HeaderNav`'s own root, so `header`'s `space-between` pushes this whole
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
