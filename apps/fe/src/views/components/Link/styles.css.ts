import { style } from '@vanilla-extract/css';

// `nowrap` + a leading literal nbsp (Link.tsx) glues the icon to the word before it — without it,
// the icon can wrap onto its own line, separated from the text it belongs to. `aria-hidden` on the
// whole span, not just the `<svg>`: the icon is decorative (Link.tsx's visually-hidden span already
// carries the meaning), and a lone nbsp text node would otherwise still get announced as blank space.
export const iconWrap = style({
  display: 'inline-flex',
  alignItems: 'center',
  whiteSpace: 'nowrap',
});

// Sized in `em`, not a fixed unit — this icon has to look right at both the `link` variant's
// inherited text size and the `primary`/`secondary` variants' button-sized text.
export const icon = style({
  width: '0.875em',
  height: '0.875em',
  marginLeft: '0.25em',
  flexShrink: 0,
});
