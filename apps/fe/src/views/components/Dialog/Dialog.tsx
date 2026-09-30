import type { Component, JSX } from 'solid-js';
import { createEffect, createSignal, createUniqueId, onCleanup, Show, untrack } from 'solid-js';

import { useI18n } from '@/common/libs/i18n';
import { lockScroll, unlockScroll } from '@/common/libs/scroll-lock';

import * as styles from './styles.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  // A function, not `JSX.Element` — a plain element prop is evaluated where it's written (in the
  // caller), so it would exist in the DOM regardless of `open`. See Dialog/AGENTS.md.
  children: () => JSX.Element;
  /** @default true */
  closeOnBackdropClick?: boolean;
}

// Opened via `.showModal()`, not the `open` attribute — the attribute alone gives a non-modal
// dialog with no focus trap, no top layer, no `::backdrop`. See Dialog/AGENTS.md.
export const Dialog: Component<DialogProps> = (props) => {
  const { t } = useI18n();
  const titleId = createUniqueId();
  // `no-unassigned-vars` flags this as always-undefined — false positive, Solid's `ref={ref}` JSX
  // compiler assigns it on mount, invisible to static analysis.
  let ref: HTMLDialogElement | undefined;
  // Distinct from `props.open`: unmounts only once the closing transition finishes, not the instant
  // `open` goes false (see the close effect below), so content doesn't vanish before the box does.
  const [mounted, setMounted] = createSignal(untrack(() => props.open));

  createEffect(() => {
    if (!ref) return;
    if (props.open) {
      setMounted(true);
      lockScroll();
      // Deferred: `setMounted(true)`'s DOM update hasn't committed synchronously yet at this point
      // (verified live), so calling `showModal()` here has nothing but the always-rendered close
      // button to focus, taking focus away from the first real field once content does mount.
      queueMicrotask(() => {
        if (ref && !ref.open) ref.showModal();
      });
      return;
    }
    if (ref.open) ref.close();
    // Waits on `ref.getAnimations()`, not `transitionend` — see Dialog/AGENTS.md for why (covers
    // reduced motion for free, no guessed timeout). No `{ subtree: true }`: only this box's own
    // transitions should count, not ones bubbling from still-mounted content inside it.
    void Promise.allSettled(ref.getAnimations().map((animation) => animation.finished)).then(() => {
      // untrack: one-time read once the promise settles, not a subscription. Guards a stale settle
      // from an abandoned close arriving after a reopen already re-locked/re-mounted.
      if (untrack(() => props.open)) return;
      setMounted(false);
      unlockScroll();
    });
  });

  // SSR disposes this component's owner right after rendering it, which fires onCleanup with no
  // `document` — guard needed or every SSR response hangs. See Dialog/AGENTS.md.
  onCleanup(() => {
    if (!import.meta.env.SSR) unlockScroll();
  });

  // The only place `onClose` is called — Escape, the close button, and backdrop clicks all just
  // call `ref.close()` and let this native event fire, so `open` can't drift out of sync.
  const handleNativeClose = () => {
    props.onClose();
  };

  const handleBackdropClick = (event: MouseEvent) => {
    if ((props.closeOnBackdropClick ?? true) && event.target === ref) ref?.close();
  };

  return (
    <dialog
      ref={ref}
      class={styles.dialog}
      aria-labelledby={titleId}
      onClose={handleNativeClose}
      onClick={handleBackdropClick}
    >
      <div class={styles.content}>
        <h2 id={titleId} class={styles.title}>
          {props.title}
        </h2>
        <Show when={mounted()}>{props.children()}</Show>
      </div>
      <button
        type="button"
        class={styles.closeButton}
        onClick={() => ref?.close()}
        aria-label={t().common.dialog.close}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </dialog>
  );
};
