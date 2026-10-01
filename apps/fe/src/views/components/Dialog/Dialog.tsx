import type { Component, JSX } from 'solid-js';
import { createUniqueId, Show } from 'solid-js';

import { useNativeDialog } from '@/common/libs/dialog/useNativeDialog';
import { reducedMotionDurationMs } from '@/common/libs/flip';
import { useI18n } from '@/common/libs/i18n';

import { DIALOG_TRANSITION_MS } from './constants';
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

// Resolves once the dialog's own `data-closing` opacity transition (styles.css.ts) finishes, or
// immediately under reduced motion — same pattern as Lightbox's `waitForBackdropFade`, reusing
// `reducedMotionDurationMs` since this transition is attribute-driven, not gated by a stylesheet
// media query of its own. See Dialog/AGENTS.md ("Close animation needs its own data-closing
// state, like Lightbox").
const waitForCloseTransition = (dialogEl: HTMLElement): Promise<void> =>
  new Promise((resolve) => {
    if (reducedMotionDurationMs(DIALOG_TRANSITION_MS) === 0) {
      resolve();
      return;
    }
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== dialogEl || event.propertyName !== 'opacity') return;
      dialogEl.removeEventListener('transitionend', onEnd);
      resolve();
    };
    dialogEl.addEventListener('transitionend', onEnd);
  });

// Opened via `.showModal()`, not the `open` attribute — the attribute alone gives a non-modal
// dialog with no focus trap, no top layer, no `::backdrop`. See Dialog/AGENTS.md. The native
// open/close mechanics live in `useNativeDialog` (common/libs/dialog), shared with Lightbox.
export const Dialog: Component<DialogProps> = (props) => {
  const { t } = useI18n();
  const titleId = createUniqueId();
  const { setRef, element, mounted, handleNativeClose } = useNativeDialog({
    open: () => props.open,
    onClose: () => props.onClose(),
    runTransition: (mutate) => {
      if (props.open) return mutate();
      if (!mounted()) return mutate();
      const dialogEl = element();
      if (!dialogEl) return mutate();
      // Drives the fade/scale-out ourselves and only calls native `close()` — via `mutate` —
      // once it's actually finished, instead of calling it immediately and hoping the engine
      // keeps the box rendered for the CSS transition's duration. See Dialog/AGENTS.md.
      dialogEl.setAttribute('data-closing', 'true');
      void waitForCloseTransition(dialogEl).then(() => {
        dialogEl.removeAttribute('data-closing');
        mutate();
      });
    },
  });

  // `props.onClose()`, not a raw `ref.close()` — calling native `close()` directly would run
  // immediately, bypassing `runTransition` above entirely. See Dialog/AGENTS.md.
  const handleBackdropClick = (event: MouseEvent) => {
    if ((props.closeOnBackdropClick ?? true) && event.target === element()) props.onClose();
  };

  // Escape fires native `cancel` before the dialog actually closes, and is cancelable —
  // preventing it stops the same immediate-native-close bypass described above, routing Escape
  // through `onClose` too instead of letting the browser close the dialog on its own.
  const handleCancel = (event: Event) => {
    event.preventDefault();
    props.onClose();
  };

  return (
    <dialog
      ref={setRef}
      class={styles.dialog}
      aria-labelledby={titleId}
      onClose={handleNativeClose}
      onCancel={handleCancel}
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
        onClick={() => props.onClose()}
        aria-label={t().common.dialog.close}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </dialog>
  );
};
