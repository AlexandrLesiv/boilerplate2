import { style } from '@vanilla-extract/css';

import * as safeArea from '../../assets/styles/safe-area.css';
import { themeVars } from '../../assets/styles/themes.css';

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1.5rem',
  paddingTop: `calc(1rem + ${safeArea.safeAreaTop})`,
  paddingRight: `calc(1rem + ${safeArea.safeAreaRight})`,
  paddingBottom: '1rem',
  paddingLeft: `calc(1rem + ${safeArea.safeAreaLeft})`,
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
  paddingRight: `calc(2rem + ${safeArea.safeAreaRight})`,
  paddingBottom: `calc(2rem + ${safeArea.safeAreaBottom})`,
  paddingLeft: `calc(2rem + ${safeArea.safeAreaLeft})`,
});
