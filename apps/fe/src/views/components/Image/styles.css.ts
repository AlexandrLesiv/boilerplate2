import { style } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

export const imageContainer = style({
  position: 'relative',
  display: 'block',
  width: '100%',
});

export const imageEl = style({
  display: 'block',
  width: '100%',
  height: 'auto',
  objectFit: 'cover',
});

// The browser derives the container's aspect ratio from the img's own width/height attributes
// (UA stylesheet default once both are set) — that only keeps working while the element stays in
// the DOM. Hiding it with `visibility` (not removing it, not `display: none`) keeps that box, which
// is what holds the layout still while the fallback overlays it.
export const imageElHidden = style({
  visibility: 'hidden',
});

// `fit="cover" | "contain"` pair: the base rules above size the box by the image's own aspect
// ratio (`height: auto`) — right for a plain responsive image, but wrong whenever a caller wants
// to force a *different* box shape (a 16:9 thumbnail crop, or a viewer that fills its container).
// Without this, `object-fit` never got a mismatched box to act on at all: the `<img>` rendered at
// its own natural ratio and silently overflowed the parent instead of being cropped/letterboxed.
// `imageElFill` makes both container and `<img>` take the *parent's* real height, not an
// auto-derived one; `imageElContain` then only needs to flip the final `object-fit` value.
// Declared after the base rules so equal-specificity `classList` combination resolves in this
// file's declaration order.
export const imageContainerFill = style({
  height: '100%',
});

export const imageElFill = style({
  height: '100%',
});

export const imageElContain = style({
  objectFit: 'contain',
});

export const fallback = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.375rem',
  padding: '0.5rem',
  overflow: 'hidden',
  backgroundColor: themeVars.color.surface,
  border: `1px dashed ${themeVars.color.border}`,
  color: themeVars.color.textSecondary,
  textAlign: 'center',
});

export const fallbackIcon = style({
  width: '2rem',
  height: '2rem',
  flexShrink: 0,
});

export const fallbackLabel = style({
  fontSize: themeVars.typography.fontSizeNormal,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
