import { keyframes, style } from '@vanilla-extract/css';

// Visual variants live in `assets/styles/interactiveVariants.css.ts`, shared with `Link` — see
// Link/AGENTS.md for why. Re-exported under this component's own names so call sites inside
// `AppButton.tsx` read naturally.
export {
  interactiveBase as buttonBase,
  interactiveVariants as buttonVariants,
} from '@/assets/styles/interactiveVariants.css';

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

// `loading`-only, so genuinely button-specific — `Link` has no loading concept, unlike the
// shared variants above. Driven by `currentColor` rather than a fixed theme token (the way
// `TimedLoader`'s own spinner uses `themeVars.color.primary`/`border`): `AppButton` renders on
// backgrounds as different as `primary` (white text) and `ghost` (dark text), and `currentColor`
// always resolves to whichever text color the current variant already uses, so the spinner
// reads correctly against any of them with no per-variant branching. `color-mix()` for the faint
// ring (vs. the full-strength moving arc) rather than a second hardcoded color, for the same
// reason — it's *always* a dimmed version of whatever `currentColor` already is.
export const spinner = style({
  display: 'inline-block',
  width: '1em',
  height: '1em',
  marginRight: '0.5em',
  flexShrink: 0,
  borderRadius: '50%',
  border: '2px solid color-mix(in srgb, currentColor 30%, transparent)',
  borderTopColor: 'currentColor',
  animation: `${spin} 0.8s linear infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});
