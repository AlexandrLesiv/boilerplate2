import { style } from '@vanilla-extract/css';

import { safeAreaBottom, safeAreaLeft, safeAreaRight, safeAreaTop } from '../../assets/styles/safe-area.css';
import { themeVars } from '../../assets/styles/themes.css';

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1.5rem',
  paddingTop: `calc(1rem + ${safeAreaTop})`,
  paddingRight: `calc(1rem + ${safeAreaRight})`,
  paddingBottom: '1rem',
  paddingLeft: `calc(1rem + ${safeAreaLeft})`,
  borderBottom: `1px solid ${themeVars.color.border}`,
});

export const headerLeft = style({
  display: 'flex',
  gap: '1.5rem',
  alignItems: 'center',
});

export const nav = style({
  display: 'flex',
  gap: '1rem',
});

export const main = style({
  paddingTop: '2rem',
  paddingRight: `calc(2rem + ${safeAreaRight})`,
  paddingBottom: `calc(2rem + ${safeAreaBottom})`,
  paddingLeft: `calc(2rem + ${safeAreaLeft})`,
});
