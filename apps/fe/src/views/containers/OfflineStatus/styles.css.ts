import { style } from '@vanilla-extract/css';

import * as safeArea from '@/assets/styles/safe-area.css';
import { themeVars } from '@/assets/styles/themes.css';
import { zIndex } from '@/assets/styles/zIndex';

// `position: absolute` — this region must not push `<main>` down when its text appears or
// disappears (a real CLS-causing layout shift, not a cosmetic one — see OfflineStatus/AGENTS.md).
// Its containing block is `layouts/styles.css.ts`'s `.header` (`position: relative`), the same
// ancestor `MobileNav`'s panel anchors against, so this needs its own `zIndex` to coordinate
// with that panel rather than relying on source order — see `assets/styles/zIndex.ts` for why it
// specifically sits above `MobileNav`'s.
export const region = style({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: zIndex.offlineBanner,
});

export const banner = style({
  margin: 0,
  // `left`/`right: 0` above resolve against `.header`'s padding box, which starts at its own
  // border edge — outside the header's own safe-area-aware padding — so this needs its own,
  // exactly like MobileNav's `nav` (see MobileNav/AGENTS.md).
  padding: `0.5rem calc(1rem + ${safeArea.safeAreaRight}) 0.5rem calc(1rem + ${safeArea.safeAreaLeft})`,
  fontSize: themeVars.typography.fontSizeNormal,
  textAlign: 'center',
});

export const offline = style([
  banner,
  {
    backgroundColor: themeVars.color.error,
    color: themeVars.color.primaryContrast,
  },
]);

export const reconnected = style([
  banner,
  {
    backgroundColor: themeVars.color.success,
    color: themeVars.color.primaryContrast,
  },
]);
