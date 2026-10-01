import { style } from '@vanilla-extract/css';

export const account = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
});

// Widest measured label across every locale/state this button shows ("Увійти", 63.6px at the
// 12px root font-size in effect when this was measured) plus buffer: 63.6 / 12 = 5.3rem needed,
// rounded up to 5.5rem. Still correct after `themes.css.ts` dropped its narrower mobile font-size
// step: the ratio a `rem` value needs is independent of which absolute size it was measured at
// (both the label and this floor scale off the same root font-size), so this didn't need
// recalculating — only this comment's framing did, since there's no second step to contrast
// against anymore. Without this floor, switching locale — or logging in/out, which swaps this
// same button between "Login" and "Log out" — changes the button's own width, shifting
// `headerRight`'s other children since `header` is `justify-content: space-between`.
export const authTrigger = style({
  minWidth: '5.5rem',
});
