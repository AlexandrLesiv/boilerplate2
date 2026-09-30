import { style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

export const container = style({
  display: 'flex',
  gap: '0.25rem',
  alignItems: 'center',
});

export const localeLink = style({
  boxSizing: 'border-box',
  display: 'inline-block',
  width: '2.25rem',
  textAlign: 'center',
  padding: '0.5rem 0',
  borderRadius: '0.25rem',
  fontSize: '0.8rem',
  textDecoration: 'none',
  fontWeight: 400,
});

export const localeLinkVariants = styleVariants({
  active: {
    background: themeVars.color.primary,
    color: themeVars.color.primaryContrast,
    fontWeight: 700,
  },
  inactive: {
    background: 'transparent',
    color: themeVars.color.textSecondary,
  },
});
