/**
 * Single source of truth for every explicit `zIndex` in the app shell, in ascending stacking
 * order (lowest first). Keys are listed in the same order they paint, so the file itself is the
 * documentation of what's above what — no more coordinating magic numbers via comments scattered
 * across each component's own `styles.css.ts`.
 *
 * `Dialog`/`Lightbox` are deliberately absent: both use the native `<dialog>` top layer
 * (`showModal()`), which always paints above every one of these regardless of value, so they
 * never need an entry here.
 */
export const zIndex = {
  /** `ContactWidget`'s FAB — the lowest fixed-position element in the shell. */
  contactWidgetTrigger: 10,
  /** `ContactWidget`'s open panel — above its own trigger so it paints on top once revealed. */
  contactWidgetPanel: 11,
  /** `MobileNav`'s open panel, absolutely positioned out of `.header`'s flow. */
  mobileNavPanel: 20,
  /** `OfflineStatus`'s banner — above `MobileNav`'s panel: if connectivity changes while the
   * mobile menu is open, the connectivity message is the more urgent of the two. */
  offlineBanner: 30,
  /** `SkipLinks` — must win against anything else in the header while focused. */
  skipLinks: 100,
} as const;
