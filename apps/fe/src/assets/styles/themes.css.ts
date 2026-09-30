import { assignVars, createTheme, createThemeContract, style } from '@vanilla-extract/css';

import { baseColorTheme } from './color/base';
import { nightColorTheme } from './color/night';
import { belowBreakpoint } from './responsive/breakpoints';

export const themeVars = createThemeContract({
  color: {
    primary: '',
    primaryHover: '',
    primaryContrast: '',
    surface: '',
    surfaceHover: '',
    border: '',
    text: '',
    textSecondary: '',
    error: '',
    success: '',
  },
  typography: {
    fontSizeNormal: '',
  },
});

// Ordinary, two-step typography — one size below `sm`, one at/above it — reusing the same
// breakpoint scale everything else in this app switches on, instead of a continuous `clamp()`.
export const FONT_SIZE_NARROW = '12px';
export const FONT_SIZE_NORMAL = '16px';

const typographyValues = { fontSizeNormal: FONT_SIZE_NORMAL };

export const generalTheme = style({
  vars: {
    ...assignVars(themeVars.color, baseColorTheme),
    ...assignVars(themeVars.typography, typographyValues),
  },
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(themeVars.color, nightColorTheme),
    },
    [belowBreakpoint('sm')]: {
      vars: assignVars(themeVars.typography, { fontSizeNormal: FONT_SIZE_NARROW }),
    },
  },
});

export const nightThemeClass = createTheme(themeVars, {
  color: nightColorTheme,
  typography: typographyValues,
});
