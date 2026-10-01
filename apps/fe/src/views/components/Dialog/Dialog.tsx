import type { Component, JSX } from 'solid-js';
import { createUniqueId, Show } from 'solid-js';

import { runAnimatedClose } from '@/common/libs/dialog/animatedClose';
import { useNativeDialog } from '@/common/libs/dialog/useNativeDialog';
import { useI18n } from '@/common/libs/i18n';
import { Heading } from '@/views/components/Heading/Heading';

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

// Opened via `.showModal()`, not the `open` attribute — the attribute alone gives a non-modal
// dialog with no focus trap, no top layer, no `::backdrop`. See Dialog/AGENTS.md. The native
// open/close mechanics live in `useNativeDialog` (common/libs/dialog), shared with Lightbox.
export const Dialog: Component<DialogProps> = (props) => {
  const { t } = useI18n();
  const titleId = createUniqueId();
  const { setRef, element, mounted, handleNativeClose, handleCancel } = useNativeDialog({
    open: () => props.open,
    onClose: () => props.onClose(),
    runTransition: (mutate) => {
      if (props.open) return mutate();
      if (!mounted()) return mutate();
      const dialogEl = element();
      if (!dialogEl) return mutate();
      // Drives the fade/scale-out ourselves and only calls native `close()` — via `mutate` —
      // once it's actually finished, instead of calling it immediately and hoping the engine
      // keeps the box rendered for the CSS transition's duration. Shared with Lightbox's
      // identical close-animation mechanism — see common/libs/dialog/animatedClose.ts and
      // Dialog/AGENTS.md.
      runAnimatedClose(dialogEl, DIALOG_TRANSITION_MS, mutate);
    },
  });

  // `props.onClose()`, not a raw `ref.close()` — calling native `close()` directly would run
  // immediately, bypassing `runTransition` above entirely. See Dialog/AGENTS.md.
  const handleBackdropClick = (event: MouseEvent) => {
    if ((props.closeOnBackdropClick ?? true) && event.target === element()) props.onClose();
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
        {/* `size="md"` keeps this dialog's existing visual size (1.25rem) — `as="h2"` alone would
        default to `Heading`'s own `lg` (1.5rem), which is a deliberate, independent choice `size`
        exists to override, not a mismatch to "fix". See Heading/AGENTS.md. */}
        <Heading as="h2" size="md" id={titleId} class={styles.title}>
          {props.title}
        </Heading>
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
