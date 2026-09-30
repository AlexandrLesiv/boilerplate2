import { style } from '@vanilla-extract/css';

export const account = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
});

// Widest measured label across every locale/state this button shows ("Увійти", 63.6px, measured
// at `themeVars.typography.fontSizeNormal`'s narrow step — 12px below the `sm` breakpoint,
// `assets/styles/themes.css.ts` — not the 16px a naive px→rem conversion would assume) plus
// buffer: 63.6 / 12 = 5.3rem needed, rounded up to 5.5rem. Without this, switching locale — or
// logging in/out, which swaps this same button between "Login" and "Log out" — changes the
// button's own width, shifting `headerRight`'s other children since `header` is
// `justify-content: space-between`. Staying in `rem` (not `px`) is deliberate: text and this
// floor both scale off the same root font-size, so the margin holds proportionally at both steps,
// not just the one this was measured at.
export const authTrigger = style({
  minWidth: '5.5rem',
});
