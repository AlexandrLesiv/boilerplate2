import { style } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

// Matches `Text`'s own secondary/small look (verified AA-safe at any size — see Text/AGENTS.md)
// without depending on `Text` itself, which renders `p`/`span`, not this mixed link/plain-text
// list. The trail links override this `color` via the global bare-`<a>` rule; the current-page
// `<span>` (styles in Breadcrumbs.tsx) keeps it.
export const list = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.375rem',
  margin: 0,
  padding: 0,
  listStyle: 'none',
  fontSize: '0.875rem',
  color: themeVars.color.textSecondary,
});

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
});
