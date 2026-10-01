import { style } from '@vanilla-extract/css';

import { READABLE_MEASURE } from '@/assets/styles/themes.css';

import { THUMBNAIL_SIZE } from './constants';

// Caps the whole article's content column at one consistent, readable line length — title, body
// copy, gallery and metadata all share it, not just the paragraphs, so the page doesn't look
// lopsided (a full-width title over a narrower paragraph block reads as broken, not intentional).
// See `Text/AGENTS.md` for why this lives here and not as a `Text`/`Heading` default.
export const container = style({
  maxWidth: READABLE_MEASURE,
});

// `Text` carries no margin by design (see Text/AGENTS.md) — spacing between paragraphs is this
// container's job, via `gap`, not something to add back onto `Text` itself.
export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '1.5rem',
});

export const coverGallery = style({
  display: 'flex',
  gap: '0.5rem',
});

// `Image` is fluid (`width: 100%`) by design — it fills whatever box it's given, it doesn't
// impose one. Without an explicit size here, this button (a flex item with no width of its own)
// stretched to fill available flex space instead of showing a 160x90 thumbnail.
export const coverTrigger = style({
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  width: `${THUMBNAIL_SIZE.width}px`,
  height: `${THUMBNAIL_SIZE.height}px`,
  flexShrink: 0,
});
