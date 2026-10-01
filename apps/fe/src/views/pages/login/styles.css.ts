import { style } from '@vanilla-extract/css';

import { FONT_SIZE_NORMAL, themeVars } from '@/assets/styles/themes.css';

export const container = style({
  maxWidth: '360px',
});

export const title = style({
  marginBottom: '1.5rem',
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
});

export const fieldGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const input = style({
  padding: '0.5rem',
  border: `1px solid ${themeVars.color.border}`,
  borderRadius: '0.375rem',
  // The literal `16px` constant, not `inherit` or `1rem` — `html`'s own font-size (global.css.ts)
  // narrows to `FONT_SIZE_NARROW` (12px) below the `sm` breakpoint, i.e. on every iPhone in
  // portrait, and `rem` is relative to that same narrowed root. Either would leave this input
  // computing under 16px on mobile, which is the exact threshold iOS Safari uses to decide
  // whether to zoom the viewport in on focus — tapping the field would yank the whole page in and
  // out of zoom instead of just focusing it.
  fontSize: FONT_SIZE_NORMAL,
  color: themeVars.color.text,
  backgroundColor: themeVars.color.surface,
});

export const errorText = style({
  color: themeVars.color.error,
});
