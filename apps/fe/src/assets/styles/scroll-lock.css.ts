import { style } from '@vanilla-extract/css';

// Applied via `classList` from Dialog.tsx, not declaratively via `html:has(dialog[open])` — the
// release has to wait for the closing transition to *finish*, not for `open` to flip. See
// Dialog/AGENTS.md ("Scrollbar gutter while open") for why: a `:has()`-driven release brings back
// the real, undarkened scrollbar while `::backdrop` is still mid-fade.
export const scrollLocked = style({
  overflow: 'hidden',
  scrollbarGutter: 'auto',
});
