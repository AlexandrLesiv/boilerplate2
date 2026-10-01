import { style } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
});

export const item = style({
  display: 'grid',
  gridTemplateColumns: '2rem 1fr',
  gap: '0 0.75rem',
  alignItems: 'start',
});

// Color/font-size come from `Text` at the call site now, not from this class — this only holds
// the layout-specific bits `Text` has no opinion on.
export const rank = style({
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  paddingTop: '0.125rem',
});

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const titleLink = style({
  color: themeVars.color.text,
  textDecoration: 'none',
  fontWeight: 600,
  lineHeight: 1.35,
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  ':hover': {
    textDecoration: 'underline',
  },
});

export const meta = style({
  fontSize: '0.8125rem',
  color: themeVars.color.textSecondary,
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
});
