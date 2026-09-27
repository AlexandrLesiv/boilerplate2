import { createVar, globalStyle } from '@vanilla-extract/css';

export const safeAreaTop = createVar();
export const safeAreaRight = createVar();
export const safeAreaBottom = createVar();
export const safeAreaLeft = createVar();

globalStyle(':root', {
  vars: {
    [safeAreaTop]: 'env(safe-area-inset-top, 0px)',
    [safeAreaRight]: 'env(safe-area-inset-right, 0px)',
    [safeAreaBottom]: 'env(safe-area-inset-bottom, 0px)',
    [safeAreaLeft]: 'env(safe-area-inset-left, 0px)',
  },
});
