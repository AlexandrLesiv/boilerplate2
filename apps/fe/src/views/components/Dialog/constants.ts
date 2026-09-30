// Not defined directly in styles.css.ts: one `.css.ts` file importing a value from another that
// also calls `style()` breaks vanilla-extract's file-scope tracking, crashing SSR. See
// Dialog/AGENTS.md.
export const DIALOG_TRANSITION_MS = 150;
