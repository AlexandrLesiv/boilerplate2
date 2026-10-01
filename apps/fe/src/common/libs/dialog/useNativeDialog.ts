import type { Accessor } from 'solid-js';
import { createEffect, createSignal, untrack } from 'solid-js';

export interface UseNativeDialogOptions {
  open: Accessor<boolean>;
  onClose: () => void;
  /**
   * Wraps the open/close DOM mutation — default just calls it immediately. Both consumers defer
   * the close-side `mutate` until their own JS-driven closing animation finishes: Lightbox's
   * measures rects and runs a FLIP animation plus its backdrop fade; Dialog's toggles a
   * `data-closing` attribute and waits on its own `transitionend`. See each component's AGENTS.md.
   */
  runTransition?: (mutate: () => void) => void;
}

export interface NativeDialogHandle {
  setRef: (el: HTMLDialogElement) => void;
  element: () => HTMLDialogElement | undefined;
  mounted: Accessor<boolean>;
  handleNativeClose: () => void;
}

// Extracted from Dialog — see Dialog/AGENTS.md for why each step exists (microtask-deferred
// showModal, getAnimations()-gated unmount instead of transitionend, two rejected alternatives).
// Lightbox reuses this unchanged; don't fork it a second time. There is deliberately no exposed
// `close()` handle — both consumers call `props.onClose()` for every dismissal path instead, so
// that `runTransition` always gets a chance to run before the real native `close()`; a raw handle
// calling `ref.close()` directly would bypass it. See either component's AGENTS.md for the bug
// that taught this ("the raw close() bypass").
export const useNativeDialog = (props: UseNativeDialogOptions): NativeDialogHandle => {
  let ref: HTMLDialogElement | undefined;
  const [mounted, setMounted] = createSignal(untrack(() => props.open()));
  const runTransition = (mutate: () => void) => (props.runTransition ?? ((fn: () => void) => fn()))(mutate);

  createEffect(() => {
    const open = props.open();
    // `runTransition` (Lightbox's version, specifically) reads other signals of its own —
    // `lastIndex`, `mounted`, the active item — while computing what to measure/log. Calling it
    // inside this effect's tracked scope would silently adopt all of those as *this* effect's
    // dependencies too, so e.g. a plain next/prev (`setLastIndex`) would re-run this open/close
    // effect and fire a second, colliding FLIP animation on top of the real one. `untrack` keeps
    // this effect's only dependency the one line above. Confirmed live: without this, the console
    // logs a duplicate `lightbox.open`/`navigate` pair on every next/prev. Dialog's own
    // `runTransition` reads only `props`/`mounted`/`element()`, none of which this effect doesn't
    // already depend on, so it wouldn't by itself have forced `untrack` here — but there's no
    // reason to special-case one caller over the other for a guard this cheap.
    untrack(() => {
      if (!ref) return;
      if (open) {
        runTransition(() => {
          setMounted(true);
          queueMicrotask(() => {
            if (ref && !ref.open) ref.showModal();
          });
        });
        return;
      }
      runTransition(() => {
        if (!ref || !ref.open) return;
        ref.close();
        // `{ subtree: true }` — without it, `getAnimations()` only sees animations whose target
        // is `ref` itself, never a descendant like Lightbox's `contentRef` FLIP. Plain `Dialog`
        // never had a descendant animation to miss, so this went unnoticed there. Also started
        // from inside `mutate`, right after `ref.close()`, rather than unconditionally after
        // calling `runTransition`: Lightbox's version of `mutate` is deferred until its own close
        // animation finishes (see Lightbox.tsx), so starting this wait unconditionally here would
        // run it before `close()` has even happened. Starting it here means it always begins
        // exactly when `close()` actually runs, whether that's sync (plain `Dialog`) or deferred.
        void Promise.allSettled(ref.getAnimations({ subtree: true }).map((animation) => animation.finished)).then(
          () => {
            if (untrack(() => props.open())) return;
            setMounted(false);
          }
        );
      });
    });
  });

  return {
    setRef: (el) => {
      ref = el;
    },
    element: () => ref,
    mounted,
    handleNativeClose: () => props.onClose(),
  };
};
