import { style } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

export const container = style({
  maxWidth: '360px',
});

export const title = style({
  marginBottom: '1.5rem',
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
});

export const fieldGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const input = style({
  padding: '0.5rem',
  border: `1px solid ${themeVars.color.border}`,
  borderRadius: '0.375rem',
  fontSize: 'inherit',
  color: themeVars.color.text,
  backgroundColor: themeVars.color.surface,
});

export const errorText = style({
  color: themeVars.color.error,
});
