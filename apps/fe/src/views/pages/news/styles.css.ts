import { style } from '@vanilla-extract/css';

import { themeVars } from '../../../assets/styles/themes.css';

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

export const rank = style({
  color: themeVars.color.textSecondary,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  paddingTop: '0.125rem',
  fontSize: '0.875rem',
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
