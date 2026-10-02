// Not defined directly in styles.css.ts: one `.css.ts` file importing a value from another that
// also calls `style()` breaks vanilla-extract's file-scope tracking, crashing SSR. See
// Dialog/AGENTS.md. Matches Lightbox's own 200ms, not Dialog's 150ms — this is also a "move a
// content box" morph, not a small UI-chrome fade.
export const CONTACT_WIDGET_TRANSITION_MS = 200;

// The chat content's own fade duration — shorter than, and *sequenced before*, the shell's own
// `CONTACT_WIDGET_TRANSITION_MS` shrink on close (see ContactWidget.tsx). Running both
// concurrently from different durations left a visible window where the shell had already
// shrunk smaller than the still-substantially-opaque content sitting on top of it — found live,
// not guessed. See ContactWidget/AGENTS.md.
export const CONTACT_WIDGET_CONTENT_TRANSITION_MS = 150;
