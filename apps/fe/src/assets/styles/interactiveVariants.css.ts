import { style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from './themes.css';

// Shared between `AppButton` (a real `<button>`) and `Link` (a real `<a>`) — the visual look
// (primary/secondary/ghost/link) is decoupled from which element renders it, so either component
// can wear either look: a `<button>` that reads as a plain inline link (a "Cancel" action sitting
// in a sentence, not a boxed CTA), or an `<a>` that reads as a button (a prominent link action).
// Neither component owns this module; both just consume it. See Link/AGENTS.md.
export const interactiveBase = style({
  display: 'inline-flex',
  cursor: 'pointer',
  userSelect: 'none',
  alignItems: 'center',
  textAlign: 'center',
  position: 'relative',
  margin: 0,
  border: 'none',
  fontSize: themeVars.typography.fontSizeNormal,
  transition: 'background-color 150ms, color 150ms, opacity 150ms, text-decoration-color 150ms',
  selectors: {
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    // `AppButton`'s own `loading` prop sets `disabled` (so the action genuinely can't be
    // re-triggered) *and* `aria-busy` — this overrides the plain `:disabled` dimming for that
    // specific case, since a temporarily-busy action reads as "in progress," not "unavailable,"
    // and a half-opacity spinner is harder to see than it needs to be. Higher specificity than
    // `&:disabled` alone (two conditions, not one) wins regardless of declaration order.
    '&:disabled[aria-busy="true"]': {
      opacity: 1,
      cursor: 'wait',
    },
  },
});

const boxed = {
  padding: '0.5rem 1rem',
  borderRadius: '0.375rem',
  fontWeight: 500,
} as const;

export const interactiveVariants = styleVariants({
  primary: {
    ...boxed,
    backgroundColor: themeVars.color.primary,
    color: themeVars.color.primaryContrast,
    selectors: {
      '&:hover:not(:disabled)': {
        backgroundColor: themeVars.color.primaryHover,
      },
    },
  },
  secondary: {
    ...boxed,
    backgroundColor: themeVars.color.surface,
    color: themeVars.color.text,
    border: `1px solid ${themeVars.color.border}`,
    selectors: {
      '&:hover:not(:disabled)': {
        backgroundColor: themeVars.color.surfaceHover,
      },
    },
  },
  ghost: {
    ...boxed,
    backgroundColor: 'transparent',
    color: themeVars.color.text,
    selectors: {
      '&:hover:not(:disabled)': {
        backgroundColor: themeVars.color.surface,
      },
    },
  },
  // No padding/background/radius — restates the global bare-`<a>` look (global.css.ts) explicitly
  // rather than relying on it, so this variant looks right regardless of which element renders it
  // and doesn't depend on inheriting incidental tag-selector styling. `linkText`, not `primary` —
  // `primary` fails WCAG AA as text-on-`surface` (3.51:1); see `color/base.ts`'s comment on
  // `linkText` for the verified numbers and why a shortcut (reusing `primaryHover`) doesn't work.
  link: {
    padding: 0,
    backgroundColor: 'transparent',
    color: themeVars.color.linkText,
    textDecoration: 'none',
    selectors: {
      '&:hover:not(:disabled)': {
        textDecoration: 'underline',
      },
    },
  },
});

export type InteractiveVariant = keyof typeof interactiveVariants;
