// Not defined directly in styles.css.ts: one `.css.ts` file importing a value from another that
// also calls `style()` breaks vanilla-extract's file-scope tracking, crashing SSR. See
// Dialog/AGENTS.md. Matches Lightbox's own 200ms, not Dialog's 150ms — this is also a "move a
// content box" morph, not a small UI-chrome fade.
export const CONTACT_WIDGET_TRANSITION_MS = 200;

// The chat content's own fade (opacity only) duration — independent of, and shorter than,
// `CONTACT_WIDGET_TRANSITION_MS`, which drives both the shell's `width`/`height` and the
// content's `clip-path` in lockstep. This one isn't load-bearing for the "content visible
// outside the shrinking box" fix (clip-path is, see ContactWidget/AGENTS.md) — it's purely the
// polish that avoids revealing a half-clipped, jumbled partial view of real chat UI while the
// clip region is still widening/narrowing.
export const CONTACT_WIDGET_CONTENT_TRANSITION_MS = 150;
