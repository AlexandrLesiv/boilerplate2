import { style } from '@vanilla-extract/css';

import { themeVars } from '../../../assets/styles/themes.css';

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
