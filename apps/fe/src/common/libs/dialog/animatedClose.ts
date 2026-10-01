import { reducedMotionDurationMs } from '@/common/libs/flip';

// Resolves once `element`'s own `transitionend` fires, or immediately under reduced motion. Not
// filtered by `event.propertyName` — deliberately so. Dialog's `[data-closing]` rule transitions
// `opacity`+`transform`; Lightbox's transitions `background-color`. Filtering by a specific name
// means this breaks the moment either stylesheet's transition list changes shape without this
// being updated to match — exactly the failure mode flagged as a risk in both components' own
// AGENTS.md before this was unified. Since nothing else on a dialog element transitions while
// `[data-closing]` is set, the first `transitionend` to fire on it is always the relevant one.
const waitForTransition = (element: HTMLElement, durationMs: number): Promise<void> =>
  new Promise((resolve) => {
    if (reducedMotionDurationMs(durationMs) === 0) {
      resolve();
      return;
    }
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== element) return;
      element.removeEventListener('transitionend', onEnd);
      resolve();
    };
    element.addEventListener('transitionend', onEnd);
  });

/**
 * Drives a `[data-closing]`-attribute CSS close animation to completion before calling `mutate`
 * (the real native `close()`), instead of calling `mutate` immediately and relying on the engine
 * to keep the dialog rendered through the transition. Both `Dialog` and `Lightbox` independently
 * hit the same cross-browser bug from doing the latter — `allow-discrete`/`overlay` not reliably
 * deferring removal outside Chrome — and fixed it the same way; this is that fix, written once.
 * See Dialog/AGENTS.md and Lightbox/AGENTS.md.
 *
 * `extra` lets a caller await additional animations alongside the dialog element's own transition
 * — Lightbox passes its content FLIP shrink; Dialog passes none.
 */
export const runAnimatedClose = (
  dialogEl: HTMLDialogElement,
  durationMs: number,
  mutate: () => void,
  extra: Promise<void>[] = []
): void => {
  dialogEl.setAttribute('data-closing', 'true');
  void Promise.all([waitForTransition(dialogEl, durationMs), ...extra]).then(() => {
    dialogEl.removeAttribute('data-closing');
    mutate();
  });
};
