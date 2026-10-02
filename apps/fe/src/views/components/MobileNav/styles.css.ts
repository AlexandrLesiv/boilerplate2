import { style } from '@vanilla-extract/css';

import { belowBreakpoint } from '@/assets/styles/responsive/breakpoints';
import * as safeArea from '@/assets/styles/safe-area.css';
import { themeVars } from '@/assets/styles/themes.css';
import { zIndex } from '@/assets/styles/zIndex';

const mobileBreakpoint = belowBreakpoint('sm');

// `display: contents` — the wrapper exists only so outside-click detection has one DOM node to
// test `.contains()` against. It must not itself generate a box: `nav`'s mobile styles below are
// `position: absolute`, taken out of flow entirely (no layout shift when it opens — see
// MobileNav/AGENTS.md), and its containing block is `layouts/styles.css.ts`'s `.header`
// (`position: relative`), not this wrapper.
export const wrapper = style({
  display: 'contents',
});

// Hidden until `sm` — the plain horizontal `nav` below already works with no toggle at all once
// there's room for it.
export const toggle = style({
  display: 'none',
  width: '2.75rem',
  height: '2.75rem',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: '0.375rem',
  background: 'transparent',
  color: themeVars.color.text,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      backgroundColor: themeVars.color.surfaceHover,
    },
  },
  '@media': {
    [mobileBreakpoint]: {
      display: 'inline-flex',
    },
  },
});

export const toggleIcon = style({
  width: '1.5rem',
  height: '1.5rem',
});

// `position: absolute` below `sm` — opening the menu must not push `<main>`'s content down
// (a real layout shift, not just a visual nuisance — see MobileNav/AGENTS.md). `left`/`right: 0`
// are resolved against `.header`'s padding box (its nearest `position: relative` ancestor), which
// starts at `.header`'s own border edge — i.e. the *outer* edge of its safe-area-aware padding —
// so this panel needs its own safe-area padding rather than inheriting the header's.
export const nav = style({
  display: 'flex',
  gap: '1rem',
  '@media': {
    [mobileBreakpoint]: {
      display: 'none',
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      flexDirection: 'column',
      gap: '0.5rem',
      paddingTop: '1rem',
      paddingBottom: `calc(1rem + ${safeArea.safeAreaBottom})`,
      paddingLeft: `calc(1rem + ${safeArea.safeAreaLeft})`,
      paddingRight: `calc(1rem + ${safeArea.safeAreaRight})`,
      backgroundColor: themeVars.color.surface,
      borderBottom: `1px solid ${themeVars.color.border}`,
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
      zIndex: zIndex.mobileNavPanel,
      // Higher specificity than the bare `.nav` rule above (attribute selector added), both
      // inside the same media query — same technique `Dialog`'s `[data-closing]` override uses,
      // so this wins regardless of source order. See Dialog/AGENTS.md.
      selectors: {
        '&[data-open="true"]': {
          display: 'flex',
        },
      },
    },
  },
});
