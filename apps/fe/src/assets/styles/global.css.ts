import './reset.css.ts';
import './safe-area.css.ts';
import { assignVars, globalStyle } from '@vanilla-extract/css';

import { baseColorTheme } from './color/base';
import { nightColorTheme } from './color/night';
import { belowBreakpoint } from './responsive/breakpoints';
import { FONT_SIZE_NORMAL, themeVars } from './themes.css';

globalStyle(':root', {
  vars: {
    ...assignVars(themeVars.color, baseColorTheme),
    ...assignVars(themeVars.typography, { fontSizeNormal: FONT_SIZE_NORMAL }),
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
  '@media': {
    [belowBreakpoint('sm')]: {
      // `stable` reserves gutter space whether or not a scrollbar actually renders — which real
      // mobile browsers never do (overlay scrollbars, zero reserved width), so this bought nothing
      // there, but it does get respected by percentage *and* `vw`-based width calculations
      // elsewhere (confirmed live: a top-layer dialog's `width: 100%`/`100vw` both resolved 15px
      // short of the real viewport width at 320px, until this was reset). `Dialog`'s own mobile
      // full-screen takeover (Dialog/styles.css.ts) is exactly that kind of calculation — see
      // Dialog/AGENTS.md.
      scrollbarGutter: 'auto',
    },
  },
  // Mobile WebKit/Blink paint a default gray/blue touch-feedback overlay on the tapped element,
  // independent of normal paint order — on a `Lightbox` trigger it was reported visible on top of
  // the dialog's own backdrop and enlarging image for a moment after tapping, since the highlight
  // isn't just a regular CSS-painted box the dialog's top-layer promotion would stack above.
  // Inherited from here rather than set per element, same reasoning as the box-sizing reset below:
  // nothing in this app's custom-styled buttons/links wants the browser's default tap feedback.
  WebkitTapHighlightColor: 'transparent',
  // Grayscale antialiasing instead of macOS's default subpixel rendering — renders text visibly
  // thinner and crisper on that platform specifically (a no-op on Windows/Linux/mobile, which
  // don't do subpixel AA the same way). App-wide here rather than only on `Text`, since every
  // piece of text on the page — headings, buttons, links — benefits identically; scoping it to
  // one component would leave the rest inconsistent for no reason.
  WebkitFontSmoothing: 'antialiased',
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

// `linkText`, not `primary` — `primary` measures 3.51:1 as text on `surface`, under WCAG AA's
// 4.5:1 for normal text. Found live via `Link`'s `a11y: { test: 'error' }` story, the first thing
// in this app to actually enforce contrast on a bare colored-text link; this bare `a` rule had
// the identical bug the whole time. See `color/base.ts`'s comment on `linkText`.
globalStyle('a', {
  color: themeVars.color.linkText,
  textDecoration: 'none',
});

globalStyle('a:hover', {
  textDecoration: 'underline',
});
