import type { Component } from 'solid-js';
import { createEffect, createSignal, createUniqueId, onCleanup, Show, untrack } from 'solid-js';

import { waitForTransition } from '@/common/libs/dialog/animatedClose';
import { useI18n } from '@/common/libs/i18n';
import { AppButton } from '@/views/components/Button/AppButton';
import { Heading } from '@/views/components/Heading/Heading';

import { CONTACT_WIDGET_TRANSITION_MS } from './constants';
import { ContactChat } from './ContactChat';
import * as styles from './styles.css';

interface Size {
  width: number;
  height: number;
}

// Shared so `.trigger` and `dialogFill` (see `styles.css.ts`'s `closedIcon`) draw the exact same
// icon, not two copies of the same path that could drift apart.
const AskQuestionIcon: Component<{ class: string }> = (props) => (
  <svg
    aria-hidden="true"
    class={props.class}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

/**
 * The app's one "ask a question" entry point — a floating action button that grows, itself,
 * into a chat panel anchored at its own bottom-right corner. The panel is a native `<dialog>`
 * (`.showModal()`), opened with its own `::backdrop`, focus trap, and top-layer promotion — an
 * earlier version was a non-modal, Intercom-style widget with no backdrop at all; switched after
 * direct feedback asking for the native dialog's semantics specifically, with the one explicit
 * constraint that the grow animation itself keep working exactly as before. See
 * ContactWidget/AGENTS.md ("Swapping to a native `<dialog>`").
 */
export const ContactWidget: Component = () => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);
  const [mounted, setMounted] = createSignal(false);
  // The dialog grows into its final shape first; the chat *content* only fades in once that's
  // fully settled — so there's never a visible frame of real chat UI squeezed into the wrong
  // size. See ContactWidget/AGENTS.md.
  const [contentVisible, setContentVisible] = createSignal(false);
  const titleId = createUniqueId();
  let triggerRef: HTMLButtonElement | undefined;
  let dialogRef: HTMLDialogElement | undefined;
  let dialogFillRef: HTMLDivElement | undefined;
  // Measured once per open, reused on close rather than re-measured — the trigger's intrinsic
  // size and the content's natural size don't change within a single open/close cycle.
  let closedSize: Size | undefined;
  // Re-measures and retargets `dialogRef`'s explicit size while open — see where it's assigned,
  // below, for why this is needed at all.
  let resizeHandler: (() => void) | undefined;

  // Mirrors `useNativeDialog`'s own open/close effect shape (tracks `open` only, `untrack`s
  // everything else) even though this hand-rolls the native dialog calls itself rather than
  // reusing that hook — `useNativeDialog`'s own `showModal()` timing is deferred by a
  // microtask internal to it, with no hook point exposed to measure a natural size synchronously
  // right after `showModal()` runs, which this component's grow animation depends on. See
  // ContactWidget/AGENTS.md.
  createEffect(() => {
    const isOpen = open();
    untrack(() => {
      if (isOpen) {
        setMounted(true);
        setContentVisible(false);
        // Deferred one frame so `dialogFillRef`'s real content (just mounted above) actually
        // exists before anything below measures it — same reasoning `Lightbox` already
        // documents for its identical `requestAnimationFrame`.
        requestAnimationFrame(() => {
          // Closed again before this frame ran — bail *without* touching `mounted`. The close
          // branch below (already running by the time this fires) owns unmounting now. See
          // ContactWidget/AGENTS.md ("Rapid open/close").
          if (!untrack(open)) return;
          if (!triggerRef || !dialogRef || !dialogFillRef) return;
          const closedRect = triggerRef.getBoundingClientRect();
          closedSize = { width: closedRect.width, height: closedRect.height };
          // Reopening mid-shrink — the dialog is already open (native `showModal()` throws if
          // called on an already-open dialog) and may still have an explicit, mid-transition
          // size set from the close that's being abandoned.
          if (!dialogRef.open) dialogRef.showModal();
          dialogRef.removeAttribute('data-closing');
          triggerRef.setAttribute('data-hidden', 'true');
          // `dialogFillRef` is a normal, statically-sized child (see styles.css.ts) — clearing
          // any leftover explicit size here measures `dialogRef`'s *true* natural size, not
          // whatever in-flight value an abandoned close left behind. Then straight to the small
          // starting size (`closedSize`, measured above) with no intermediate restore — nothing
          // else is set in between, so there's only one real value change for the browser to
          // commit before the actual grow target, not two (the second of which would otherwise
          // itself be a real, transitioned change away from a just-committed "natural size"
          // frame — confirmed live: without this, the whole grow and the content reveal that
          // waits on its `transitionend` silently never happened at all, since the size jumped
          // straight to its target with nothing to transition from in the first place).
          dialogRef.style.width = '';
          dialogRef.style.height = '';
          const openRect = dialogRef.getBoundingClientRect();
          dialogRef.style.width = `${closedSize.width}px`;
          dialogRef.style.height = `${closedSize.height}px`;
          void dialogRef.offsetWidth;
          dialogRef.style.width = `${openRect.width}px`;
          dialogRef.style.height = `${openRect.height}px`;
          dialogFillRef.setAttribute('data-open', 'true');
          void waitForTransition(dialogRef, CONTACT_WIDGET_TRANSITION_MS).then(() => {
            if (!untrack(open)) return;
            setContentVisible(true);
          });
          // `dialogFill`'s own width is live CSS (`380px` desktop, `calc(100vw - ...)` mobile) —
          // it recalculates the instant the viewport crosses the breakpoint. `dialogRef`'s width/
          // height, set as explicit inline pixels just above, are not: nothing re-measures them
          // again after this point on its own. Without this listener, opening at one viewport
          // width and then resizing *without* closing left `dialogFill` reactively resizing to
          // match the new breakpoint while `dialogRef` stayed frozen at the old target, so
          // `dialogFill` overflowed past `dialogRef`'s own (now stale) bounds — confirmed live:
          // open at 900px, resize to 470px without closing, `dialogFill` grows to the mobile
          // width while `dialogRef` stays pinned at its desktop one. Removing any previous
          // handler first guards the rare case of reopening before a prior close's own listener
          // cleanup (below) ever ran — see ContactWidget/AGENTS.md ("Rapid open/close").
          if (resizeHandler) window.removeEventListener('resize', resizeHandler);
          resizeHandler = () => {
            if (!dialogRef || !triggerRef || dialogRef.hasAttribute('data-closing')) return;
            const closedRect = triggerRef.getBoundingClientRect();
            closedSize = { width: closedRect.width, height: closedRect.height };
            dialogRef.style.width = '';
            dialogRef.style.height = '';
            const rect = dialogRef.getBoundingClientRect();
            dialogRef.style.width = `${rect.width}px`;
            dialogRef.style.height = `${rect.height}px`;
          };
          window.addEventListener('resize', resizeHandler);
        });
        return;
      }
      setContentVisible(false);
      if (!mounted()) return;
      if (!triggerRef || !dialogRef || !dialogFillRef || !closedSize) {
        setMounted(false);
        return;
      }
      dialogFillRef.removeAttribute('data-open');
      // Drives the backdrop's own fade-out (see `dialogShell`'s `&:modal[data-closing]::backdrop`
      // selector) — native `close()` isn't called until the shrink below actually finishes, not
      // immediately, so the dialog (and its backdrop) stay rendered for the whole transition
      // instead of vanishing the instant this runs.
      dialogRef.setAttribute('data-closing', 'true');
      dialogRef.style.width = `${closedSize.width}px`;
      dialogRef.style.height = `${closedSize.height}px`;
      void waitForTransition(dialogRef, CONTACT_WIDGET_TRANSITION_MS).then(() => {
        if (untrack(open)) return;
        if (dialogRef) {
          dialogRef.close();
          dialogRef.removeAttribute('data-closing');
          dialogRef.style.width = '';
          dialogRef.style.height = '';
        }
        if (triggerRef) triggerRef.removeAttribute('data-hidden');
        if (resizeHandler) {
          window.removeEventListener('resize', resizeHandler);
          resizeHandler = undefined;
        }
        setMounted(false);
      });
    });
  });

  onCleanup(() => {
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  });

  // Click on the backdrop itself (never on anything inside the dialog's own content, which has
  // a different `event.target`) closes it — same pattern `Dialog.tsx` uses for the same reason.
  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === dialogRef) setOpen(false);
  };

  return (
    <>
      <AppButton
        variant="primary"
        ref={(el) => (triggerRef = el)}
        class={styles.trigger}
        aria-label={t().common.contact.triggerLabel}
        onClick={() => setOpen(true)}
      >
        <AskQuestionIcon class={styles.triggerIcon} />
      </AppButton>
      <dialog
        ref={(el) => (dialogRef = el)}
        class={styles.dialogShell}
        aria-labelledby={titleId}
        onCancel={(event) => {
          // Escape fires `cancel` before the dialog actually closes, and it's cancelable —
          // preventing it stops the browser's own immediate native close, routing Escape through
          // `setOpen(false)` (and this component's own shrink animation) instead.
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        onClick={handleBackdropClick}
      >
        <div ref={(el) => (dialogFillRef = el)} class={styles.dialogFill}>
          <AskQuestionIcon class={styles.closedIcon} />
          <div class={styles.panelContent} data-visible={contentVisible() ? 'true' : undefined}>
            <button
              type="button"
              class={styles.closeButton}
              onClick={() => setOpen(false)}
              aria-label={t().common.contact.close}
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <Heading as="h2" size="md" id={titleId} class={styles.panelTitle}>
              {t().common.contact.dialogTitle}
            </Heading>
            <Show when={mounted()}>
              <ContactChat />
            </Show>
          </div>
        </div>
      </dialog>
    </>
  );
};
