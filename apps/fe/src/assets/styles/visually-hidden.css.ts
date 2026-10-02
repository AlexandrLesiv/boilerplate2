import { style } from '@vanilla-extract/css';

// Off-screen via clipping, not `display`/`visibility` — either would drop this from the
// accessibility tree along with the viewport.
export const visuallyHidden = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});
