export interface FlipRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface FlipOptions {
  durationMs: number;
  easing?: string;
}

const DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

// Exported so Lightbox can apply the same check to its backdrop fade, which is a plain
// attribute-toggled CSS transition rather than a `flip` call but still has no stylesheet rule of
// its own to hook `prefers-reduced-motion` into from JS. Everywhere else in this repo reduced
// motion is handled purely in CSS (see Dialog/AGENTS.md) — this is the one exception, now reused
// by two callers instead of one.
export const reducedMotionDurationMs = (durationMs: number): number =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : durationMs;

// Center-based, so the default `transform-origin: 50% 50%` already does the right thing — no
// CSS needed on the animated element. Produces only `transform` (translate + scale), which the
// compositor can run off the main thread; animating `width`/`height` instead would force layout
// on every frame.
//
// Uniform scale — one factor, not `scaleX`/`scaleY` independently — on purpose. `object-fit`'s
// crop is computed from the element's own *layout* box, which a `transform` never changes (only
// paint does); if `from` and `to` ever had different aspect ratios, a non-uniform `scale(sx, sy)`
// would stretch the already-cropped photo's pixels unevenly. Lightbox guarantees `from`/`to`
// always share a ratio (see Lightbox/AGENTS.md's `--lightbox-ratio`), so `scaleX`/`scaleY` come
// out equal anyway — this is just one number instead of writing the same one twice.
const invert = (from: FlipRect, to: FlipRect): string => {
  const scale = Math.min(from.width / to.width, from.height / to.height);
  const translateX = from.left + from.width / 2 - (to.left + to.width / 2);
  const translateY = from.top + from.height / 2 - (to.top + to.height / 2);
  return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
};

// Transitions `element`'s `transform` to `to`, resolving once it's actually finished playing (or
// immediately under reduced motion). Does *not* reset the starting value first — relies on CSS
// transition retargeting: setting a new target value on a property that's already mid-transition
// smoothly continues from wherever it currently is, rather than jumping. Reassigning the same
// `transition` declaration (same duration/easing string) doesn't restart or cancel what's
// in-flight — only the target value changes. This is what makes closing safe to call while an
// open animation is still playing — see Lightbox/AGENTS.md ("pressing close before the open
// animation finishes").
const transitionTo = (element: HTMLElement, to: string, durationMs: number, easing: string): Promise<void> =>
  new Promise((resolve) => {
    const duration = reducedMotionDurationMs(durationMs);
    if (duration === 0) {
      element.style.transition = '';
      element.style.transform = '';
      resolve();
      return;
    }
    element.style.transition = `transform ${duration}ms ${easing}`;
    element.style.transform = to;
    const cleanup = () => {
      element.style.transition = '';
      element.style.transform = '';
      element.removeEventListener('transitionend', cleanup);
      resolve();
    };
    element.addEventListener('transitionend', cleanup);
  });

/**
 * Animates `element` growing from `fromRect` into its own current (already-final) layout box.
 * Call once `element` is actually laid out at its natural position — e.g. right after mounting
 * it — not before. Resolves once the animation has finished playing.
 */
export const flipFrom = (element: HTMLElement, fromRect: FlipRect, options: FlipOptions): Promise<void> => {
  // Snaps to an artificial "looks like `fromRect`" starting point first, unlike `flipTo` below —
  // there's nothing to retarget *from* here: `element` just mounted fresh, with no prior
  // transform to continue from. The forced `offsetWidth` read makes that snap a real committed
  // frame rather than something the browser coalesces away with the transition that follows.
  element.style.transition = 'none';
  element.style.transform = invert(fromRect, element.getBoundingClientRect());
  void element.offsetWidth;
  return transitionTo(element, 'none', options.durationMs, options.easing ?? DEFAULT_EASING);
};

/** Animates `element`, at its current position/size, shrinking into `toRect`. Resolves once the animation has finished playing. */
export const flipTo = (element: HTMLElement, toRect: FlipRect, options: FlipOptions): Promise<void> => {
  // Measures `element`'s true, untransformed layout rect — not whatever `getBoundingClientRect()`
  // would report right now. If an open animation is still mid-flight when this is called
  // (pressing close before it finishes), `getBoundingClientRect()` reflects the current,
  // transient *painted* size, not the real settled one, which would compute a wrong shrink
  // target. Clearing `transform`, measuring, then restoring whatever it was, all synchronously
  // before any paint happens, gets the correct answer with no visible flicker.
  const previousTransform = element.style.transform;
  element.style.transform = 'none';
  const naturalRect = element.getBoundingClientRect();
  element.style.transform = previousTransform;
  return transitionTo(element, invert(toRect, naturalRect), options.durationMs, options.easing ?? DEFAULT_EASING);
};
