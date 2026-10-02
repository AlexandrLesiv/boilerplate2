import type { Component, JSX } from 'solid-js';
import { createUniqueId, Show } from 'solid-js';

import { responsiveBreakPoints } from '@/assets/styles/responsive/breakpoints';
import { runAnimatedClose } from '@/common/libs/dialog/animatedClose';
import { useNativeDialog } from '@/common/libs/dialog/useNativeDialog';
import { useI18n } from '@/common/libs/i18n';
import { Heading } from '@/views/components/Heading/Heading';

import { DIALOG_TRANSITION_MS } from './constants';
import * as styles from './styles.css';

const MOBILE_BREAKPOINT_PX = Number.parseInt(responsiveBreakPoints.sm, 10);

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  // A function, not `JSX.Element` — a plain element prop is evaluated where it's written (in the
  // caller), so it would exist in the DOM regardless of `open`. See Dialog/AGENTS.md.
  children: () => JSX.Element;
  /** @default true */
  closeOnBackdropClick?: boolean;
  // Omit to keep the open/close scale centered on the dialog itself — see Dialog/AGENTS.md
  // ("Anchoring the open/close pivot to a trigger element").
  getAnchorElement?: () => HTMLElement | null | undefined;
}

// Opened via `.showModal()`, not the `open` attribute — the attribute alone gives a non-modal
// dialog with no focus trap, no top layer, no `::backdrop`. See Dialog/AGENTS.md. The native
// open/close mechanics live in `useNativeDialog` (common/libs/dialog), shared with Lightbox.
export const Dialog: Component<DialogProps> = (props) => {
  const { t } = useI18n();
  const titleId = createUniqueId();

  // Points the scale transition's pivot at the real trigger element instead of the dialog's own
  // center, so the card visibly grows from/shrinks toward the button that opened it rather than
  // popping out of empty space. Viewport-center, not a measured dialog rect: the desktop card is
  // genuinely centered in the viewport (see Dialog/AGENTS.md's "Centering" note), so that's a
  // known quantity even before `showModal()` has run, with no rect-measurement race to get wrong.
  // Skipped below `sm` on purpose — the mobile full-screen takeover isn't viewport-centered the
  // same way (see Dialog/AGENTS.md), so the offset math doesn't hold there, and a full-bleed sheet
  // doesn't need a button-anchor cue anyway. Re-run on every open *and* close (not cached from
  // open) so a resize/scroll while the dialog is open doesn't leave a stale pivot for the close.
  const applyAnchorOrigin = () => {
    const dialogEl = element();
    if (!dialogEl) return;
    const anchor = props.getAnchorElement?.();
    if (!anchor || window.innerWidth < MOBILE_BREAKPOINT_PX) {
      dialogEl.style.removeProperty('--dialog-origin-x');
      dialogEl.style.removeProperty('--dialog-origin-y');
      return;
    }
    const anchorRect = anchor.getBoundingClientRect();
    dialogEl.style.setProperty(
      '--dialog-origin-x',
      `calc(50% + ${anchorRect.left + anchorRect.width / 2 - window.innerWidth / 2}px)`
    );
    dialogEl.style.setProperty(
      '--dialog-origin-y',
      `calc(50% + ${anchorRect.top + anchorRect.height / 2 - window.innerHeight / 2}px)`
    );
  };

  const { setRef, element, mounted, handleNativeClose, handleCancel } = useNativeDialog({
    open: () => props.open,
    onClose: () => props.onClose(),
    runTransition: (mutate) => {
      if (props.open) {
        applyAnchorOrigin();
        return mutate();
      }
      if (!mounted()) return mutate();
      const dialogEl = element();
      if (!dialogEl) return mutate();
      applyAnchorOrigin();
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
