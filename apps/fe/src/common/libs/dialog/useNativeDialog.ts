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
  handleCancel: (event: Event) => void;
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
            if (!ref) return;
            // Mirrors the close path's own `props.open()` re-check below — this microtask was
            // queued when `open` was `true`, but by the time it actually runs the user may have
            // closed again (rapid open/close, especially on mobile where a tap can register
            // before the previous one's microtask has even flushed). `ref.open` alone can't tell
            // the difference: `showModal()` hasn't run yet either way, so `!ref.open` is true
            // whether the user still wants it open or already changed their mind. Without this,
            // `showModal()` fired anyway — reported live as the dialog popping back open on its
            // own right after being closed, with `mounted` left stuck `true` forever afterward
            // since neither branch here nor the close branch above ever got a chance to set it
            // back to `false` (the close branch had already bailed out on `!ref.open` too, for
            // the identical reason).
            if (!untrack(() => props.open())) {
              setMounted(false);
              return;
            }
            if (!ref.open) ref.showModal();
          });
        });
        return;
      }
      runTransition(() => {
        if (!ref || !ref.open) return;
        // Guards against a reopen that happened *during* this close animation — this `mutate`
        // was deferred until the close animation's own promises settled (`runAnimatedClose`),
        // and if the user reopened in that window, `props.open()` is `true` again by the time it
        // fires. Without this, `ref.close()` would yank the dialog shut out from under whatever
        // the reopen already showed. Reported live: rapidly closing then immediately reopening
        // left the dialog looking reopened for a moment, then it closed itself on its own a
        // couple hundred ms later with no further input — the original close's deferred callback,
        // still pending, firing late.
        if (untrack(() => props.open())) return;
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
    // Escape fires native `cancel` before the dialog actually closes, and is cancelable —
    // preventing it stops the same immediate-native-close bypass `handleNativeClose`'s own doc
    // comment above describes, routing Escape through `onClose` too instead of letting the
    // browser close the dialog on its own. Both consumers wire this to the dialog's `onCancel`.
    handleCancel: (event: Event) => {
      event.preventDefault();
      props.onClose();
    },
  };
};
