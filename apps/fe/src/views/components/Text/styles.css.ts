import { style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '@/assets/styles/themes.css';

export const base = style({
  lineHeight: 1.5,
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  // Avoids a lone short word stranded alone on a paragraph's last line. `balance` (even line
  // lengths) is the sibling property for short, single/few-line text like `Heading` — `pretty`
  // specifically targets the *last* line of longer, wrapping body copy, which is what `Text`
  // actually renders. No fallback branch needed: unsupported engines just ignore the declaration
  // and wrap normally, so this is a pure progressive enhancement. See Text/AGENTS.md.
  textWrap: 'pretty',
});

export const variants = styleVariants({
  primary: { color: themeVars.color.text },
  secondary: { color: themeVars.color.textSecondary },
});

// `small` is `0.875rem`, still well above the ~4.5:1 contrast floor `textSecondary` already clears
// at any size (verified against the real theme color values, not assumed) — shrinking further
// than this risks illegibility before it risks contrast compliance. See Text/AGENTS.md.
export const sizes = styleVariants({
  normal: { fontSize: themeVars.typography.fontSizeNormal },
  small: { fontSize: '0.875rem' },
});

// Opt-in via the `numeric` prop — see Text.tsx for why this isn't a default.
export const numeric = style({
  fontVariantNumeric: 'tabular-nums',
});
