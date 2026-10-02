import { style } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

// Browsers no longer draw this by default (Firefox dropped the dotted-underline UA style) —
// without it, an abbreviation with a `title` is visually identical to plain text.
// `border-bottom`, not `text-decoration: underline dotted` — the latter's dot size/spacing is
// glyph-relative and not controllable, and renders as a thick, tight line in Chromium. A border
// gives an even, consistently-spaced dotted line, with `padding-bottom` (not
// `text-underline-offset`) keeping it clear of descenders.
export const base = style({
  textDecoration: 'none',
  borderBottomWidth: '1px',
  borderBottomStyle: 'dotted',
  borderBottomColor: themeVars.color.textSecondary,
  paddingBottom: '2px',
  cursor: 'help',
});
