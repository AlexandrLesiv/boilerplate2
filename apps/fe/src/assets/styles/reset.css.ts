import { globalStyle } from '@vanilla-extract/css';
import { normalize } from 'polished';

const styleRules = normalize().flatMap((rule) => Object.entries(rule));

for (const [selector, declaration] of styleRules) {
  if (typeof declaration === 'object' && declaration !== null) {
    globalStyle(selector, declaration as Parameters<typeof globalStyle>[1]);
  }
}
