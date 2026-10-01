import { assignVars, createTheme, createThemeContract, style } from '@vanilla-extract/css';

import { baseColorTheme } from './color/base';
import { nightColorTheme } from './color/night';

export const themeVars = createThemeContract({
  color: {
    primary: '',
    primaryHover: '',
    primaryContrast: '',
    linkText: '',
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

// One size, every viewport — deliberately not smaller on mobile. A narrower `FONT_SIZE_NARROW`
// step (12px) used to apply below `sm`; removed after checking real mobile-typography practice
// (and a reference site's own live computed styles) rather than assuming "smaller screen, smaller
// text" was the right default — smaller mobile text is backwards from nearly every mobile-
// typography guideline, and it was also shrinking every `rem`-based spacing value site-wide by the
// same factor as an unintended side effect, since `html`'s own font-size drove this var. See
// `global.css.ts` (where this var is actually applied to `:root`) and `LoginDialog/styles.css.ts`
// for a `rem`-based floor that depended on this value possibly differing from 16px.
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
  },
});

export const nightThemeClass = createTheme(themeVars, {
  color: nightColorTheme,
  typography: typographyValues,
});
