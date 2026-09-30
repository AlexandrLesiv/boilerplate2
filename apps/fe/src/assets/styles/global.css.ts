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
  // a tall page never shifts content sideways — and stays reserved while `html:has(dialog[open])`
  // below locks `overflow`, so that lock/unlock never shifts content either. Verified live: an
  // earlier version toggled this to `auto` and compensated with a JS-measured `padding-right`
  // instead; dropped after confirming this permanent `stable` alone is jitter-free.
  scrollbarGutter: 'stable',
  scrollbarColor: `${themeVars.color.border} ${themeVars.color.surface}`,
});

// Background scroll lock for any open native `<dialog>`, not just this app's own `Dialog`
// component — `:has()` reacts to the `open` attribute directly, so no JS is involved at all. See
// Dialog/AGENTS.md ("Scrollbar gutter while open") for why an earlier JS-driven version of this
// (locking/releasing on a delay, to protect a scrollbar-color coordination that no longer exists)
// was replaced by this simpler rule.
globalStyle(':root:has(dialog[open])', {
  overflow: 'hidden',
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
