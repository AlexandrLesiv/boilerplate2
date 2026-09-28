import { style } from '@vanilla-extract/css';

import { themeVars } from '../../../assets/styles/themes.css';

export const container = style({
  // An inline-size container, so everything below scales to whatever this is dropped into
  // rather than to the viewport.
  containerType: 'inline-size',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.75rem',
  width: '100%',
  maxWidth: 'min(32rem, 100%)',
  boxSizing: 'border-box',
});

export const statusCode = style({
  margin: 0,
  fontSize: 'clamp(1.75rem, 12cqi, 3.5rem)',
  fontWeight: 700,
  lineHeight: 1,
  color: themeVars.color.textSecondary,
});

export const title = style({
  margin: 0,
  fontSize: 'clamp(1.125rem, 6cqi, 1.75rem)',
  overflowWrap: 'anywhere',
});

export const description = style({
  margin: 0,
  color: themeVars.color.textSecondary,
  overflowWrap: 'anywhere',
});

export const actionRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.75rem',
});

export const supportPrompt = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.5rem',
  marginTop: '0.5rem',
  paddingTop: '0.75rem',
  borderTop: `1px solid ${themeVars.color.border}`,
  width: '100%',
});

export const supportText = style({
  margin: 0,
  color: themeVars.color.textSecondary,
  overflowWrap: 'anywhere',
});
