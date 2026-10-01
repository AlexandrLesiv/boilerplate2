// Both thumbnail and enlarged view crop via `fit="cover"` — consistent framing across every
// photo regardless of its own aspect ratio, deliberately accepting cropping over `contain`'s
// alternative (show the full photo, but let letterboxing vary per photo's own shape, which read
// as "images are randomly different sizes" rather than "images are different shapes").
// `FULL_SIZE` is just a sizing hint for the box, not the photo's real dimensions.
//
// Not defined directly in styles.css.ts: one `.css.ts` file importing a value from another that
// also calls `style()` breaks vanilla-extract's file-scope tracking, crashing SSR. See
// Dialog/constants.ts for the same pattern — `styles.css.ts` and `ArticlePage.tsx` both import
// `THUMBNAIL_SIZE` from here instead.
export const THUMBNAIL_SIZE = { width: 160, height: 90 };
export const FULL_SIZE = { width: 960, height: 540 };
