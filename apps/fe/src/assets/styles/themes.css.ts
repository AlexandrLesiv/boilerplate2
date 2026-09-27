import { assignVars, createTheme, createThemeContract, style } from '@vanilla-extract/css';

import { baseColorTheme } from './color/base';
import { nightColorTheme } from './color/night';
import { normalFontSize } from './typography/fluid';

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

const typographyValues = { fontSizeNormal: normalFontSize };

export const generalTheme = style({
  vars: {
    ...assignVars(themeVars.color, baseColorTheme),
    ...assignVars(themeVars.typography, typographyValues),
  },
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(themeVars.color, nightColorTheme),
    },
  },
});

export const nightThemeClass = createTheme(themeVars, {
  color: nightColorTheme,
  typography: typographyValues,
});
