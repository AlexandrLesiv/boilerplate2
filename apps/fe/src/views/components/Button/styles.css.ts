import { composeStyles, style, styleVariants } from '@vanilla-extract/css';

import { styleContainer } from '@/assets/styles/mixins.css';
import { themeVars } from '@/assets/styles/themes.css';

export const buttonBase = composeStyles(
  styleContainer({
    display: 'inline-flex',
    cursor: 'pointer',
    userSelect: 'none',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    margin: 'none',
  }),
  style({
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: themeVars.typography.fontSizeNormal,
    fontWeight: 500,
    transition: 'background-color 150ms, color 150ms, opacity 150ms',
    selectors: {
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  })
);

export const buttonVariants = styleVariants({
  primary: {
    backgroundColor: themeVars.color.primary,
    color: themeVars.color.primaryContrast,
    selectors: {
      '&:hover:not(:disabled)': {
        backgroundColor: themeVars.color.primaryHover,
      },
    },
  },
  secondary: {
    backgroundColor: themeVars.color.surface,
    color: themeVars.color.text,
    border: `1px solid ${themeVars.color.border}`,
    selectors: {
      '&:hover:not(:disabled)': {
        backgroundColor: themeVars.color.surfaceHover,
      },
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: themeVars.color.text,
    selectors: {
      '&:hover:not(:disabled)': {
        backgroundColor: themeVars.color.surface,
      },
    },
  },
});
