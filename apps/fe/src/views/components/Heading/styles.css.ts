import { style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

// `rem`, not a fixed `px` scale — tracks the root font-size (`themeVars.typography.fontSizeNormal`,
// themes.css.ts) rather than a hardcoded pixel value, so the whole scale moves together if that
// single root value is ever revisited, instead of this needing its own separate update.
export const base = style({
  color: themeVars.color.text,
  fontWeight: 700,
  lineHeight: 1.2,
  // Long unbroken content (article titles, URLs) wraps instead of overflowing its container —
  // the same rule `views/pages/news/styles.css.ts`'s `titleLink` already uses.
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
});

export const sizes = styleVariants({
  xl: { fontSize: '2rem' },
  lg: { fontSize: '1.5rem' },
  md: { fontSize: '1.25rem' },
  sm: { fontSize: '1.125rem' },
  xs: { fontSize: '1rem' },
});
