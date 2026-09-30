import './reset.css.ts';
import './safe-area.css.ts';
import { assignVars, globalStyle } from '@vanilla-extract/css';

import { baseColorTheme } from './color/base';
import { nightColorTheme } from './color/night';
import { themeVars } from './themes.css';
import { normalFontSize } from './typography/fluid';

globalStyle(':root', {
  vars: {
    ...assignVars(themeVars.color, baseColorTheme),
    ...assignVars(themeVars.typography, { fontSizeNormal: normalFontSize }),
  },
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(themeVars.color, nightColorTheme),
    },
  },
});

globalStyle('html', {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: themeVars.typography.fontSizeNormal,
  lineHeight: 1.5,
  color: themeVars.color.text,
  backgroundColor: themeVars.color.surface,
  // Reserves the scrollbar's width whether or not one is shown, so navigating between a short and
  // a tall page never shifts content sideways. While a dialog is open, `scroll-lock.css.ts`'s
  // `scrollLocked` switches this to `auto` and Dialog's own measured `padding-right` takes over —
  // see Dialog/AGENTS.md ("Scrollbar gutter while open") for why.
  scrollbarGutter: 'stable',
  scrollbarColor: `${themeVars.color.border} ${themeVars.color.surface}`,
});

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
});

globalStyle('body', {
  minHeight: '100dvh',
  backgroundColor: themeVars.color.surface,
  color: themeVars.color.text,
});

globalStyle('a', {
  color: themeVars.color.primary,
  textDecoration: 'none',
});

globalStyle('a:hover', {
  textDecoration: 'underline',
});
