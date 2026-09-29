import { keyframes, style } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const spinner = style({
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
  borderRadius: '50%',
  border: `2px solid ${themeVars.color.border}`,
  borderTopColor: themeVars.color.primary,
  animation: `${spin} 0.8s linear infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const message = style({
  margin: 0,
  fontSize: themeVars.typography.fontSizeNormal,
  color: themeVars.color.textSecondary,
});

export const slowMessage = style([message, { fontStyle: 'italic' }]);
