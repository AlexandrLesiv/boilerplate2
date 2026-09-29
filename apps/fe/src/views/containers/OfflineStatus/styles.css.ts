import { style } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

export const banner = style({
  margin: 0,
  padding: '0.5rem 1rem',
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
