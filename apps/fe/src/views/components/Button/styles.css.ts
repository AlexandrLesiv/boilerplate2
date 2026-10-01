// Visual variants live in `assets/styles/interactiveVariants.css.ts`, shared with `Link` — see
// Link/AGENTS.md for why. Re-exported under this component's own names so call sites inside
// `AppButton.tsx` read naturally; nothing button-specific is defined in this file.
export {
  interactiveBase as buttonBase,
  interactiveVariants as buttonVariants,
} from '@/assets/styles/interactiveVariants.css';
