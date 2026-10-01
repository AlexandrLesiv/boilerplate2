// Isolated from styles.css.ts — a `.css.ts` file importing a value from another `.css.ts` file
// that also calls `style()` crashes vanilla-extract's SSR file-scope tracking. See Dialog/AGENTS.md.
// Longer than Dialog's 150ms: this is a full-screen move, not a small card fade.
export const LIGHTBOX_TRANSITION_MS = 200;
