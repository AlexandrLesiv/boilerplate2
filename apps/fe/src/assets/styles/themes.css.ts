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

// The classic typographic "measure" — 45-75 characters per line is the generally agreed-on
// comfortable range for continuous prose (Bringhurst's *Elements of Typographic Style*; the same
// range most web-typography guides converge on), with ~65 as the commonly-cited sweet spot. `ch`
// tracks this directly regardless of font-size, unlike a fixed `px`/`rem` width, which only
// happens to match a given character count at one specific font-size. Applied at a page's own
// content container — never as a `Text`/`Heading` default, since plenty of real text (labels,
// captions, table cells) has no business being capped at prose width. See `Text/AGENTS.md`.
export const READABLE_MEASURE = '65ch';

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
