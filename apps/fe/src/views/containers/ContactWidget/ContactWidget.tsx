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

// `clip-path` that hides everything *except* the bottom-right `closed`-sized region of a box
// that's `open`-sized — i.e. the portion of the (always full-size) content layer that currently
// overlaps the trigger's own (still small) visual bounds. See ContactWidget/AGENTS.md ("Clipped
// to the trigger's own bounds").
const clipFor = (closed: Size, open: Size): string =>
  `inset(${open.height - closed.height}px 0px 0px ${open.width - closed.width}px)`;

/**
 * The app's one "ask a question" entry point — a floating action button that grows, itself, into
 * a chat panel anchored at its own bottom-right corner, rather than opening a centered/
 * full-screen `Dialog`. Non-modal by design: the rest of the page stays interactive, matching the
 * conventional chat-widget pattern this is modeled on (Intercom/Drift/Zendesk), and unlike
 * `Dialog` there's no backdrop, no focus trap, and no native `<dialog>` involved at all. See
 * ContactWidget/AGENTS.md for why `Dialog` was dropped and how the grow animation works.
 */
export const ContactWidget: Component = () => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);
  const [mounted, setMounted] = createSignal(false);
  // The trigger grows into its final shape first; the chat *content* only fades in once that's
  // fully settled — so there's never a visible frame of real chat UI squeezed into the wrong
  // size. See ContactWidget/AGENTS.md.
  const [contentVisible, setContentVisible] = createSignal(false);
  const panelId = createUniqueId();
  const titleId = createUniqueId();
  let triggerRef: HTMLButtonElement | undefined;
  let panelRef: HTMLDivElement | undefined;
  // Measured once per open, reused on close rather than re-measured — the trigger's intrinsic
  // size and the content layer's natural size don't change within a single open/close cycle.
  let closedSize: Size | undefined;
  let openSize: Size | undefined;

  // Mirrors `useNativeDialog`'s own open/close effect shape (tracks `open` only, `untrack`s
  // everything else) even though this isn't a native dialog — same reason: `mounted`/the refs
  // read here must not become extra dependencies of this effect.
  createEffect(() => {
    const isOpen = open();
    untrack(() => {
      if (isOpen) {
        setMounted(true);
        setContentVisible(false);
        // Deferred one frame so `panelRef` is actually laid out (at its own natural size) before
        // its rect is measured below — same reasoning `Lightbox` already documents for its
        // identical `requestAnimationFrame`.
        requestAnimationFrame(() => {
          // Closed again before this frame ran — bail *without* touching `mounted`. The close
          // branch below (already running by the time this fires) owns unmounting now; if this
          // callback also called `setMounted(false)`, it would race whichever of the two actually
          // finishes last. See ContactWidget/AGENTS.md ("Rapid open/close").
          if (!untrack(open)) return;
          if (!triggerRef || !panelRef) return;
          // A `width`/`height` transition can't interpolate from `auto`, and the button's
          // natural (closed) size is locale-dependent (text length), so it can't be a constant
          // either — freeze it as explicit pixels first. No visual change: this is the same size
          // it already has.
          const closedRect = triggerRef.getBoundingClientRect();
          triggerRef.style.width = `${closedRect.width}px`;
          triggerRef.style.height = `${closedRect.height}px`;
          // `panelRef` (the content layer) lays itself out at its own natural size — this fixed
          // width, or edge-to-edge on mobile; height from its real content — entirely
          // independently of the trigger's current size. Measuring it is what tells the trigger
          // how big to grow into; see ContactWidget/AGENTS.md.
          const openRect = panelRef.getBoundingClientRect();
          closedSize = { width: closedRect.width, height: closedRect.height };
          openSize = { width: openRect.width, height: openRect.height };
          // `panelContent`'s own base CSS `clip-path` is `inset(0)` — writing the *closed* clip
          // directly (next line) would itself be a transitionable change from that base value,
          // which the real target (`inset(0)`, right after) would then retarget away from
          // almost instantly — confirmed live via `getAnimations()` showing no running
          // animation at all: the clip never visibly showed the closed state, just snapped
          // straight to fully revealed. `transition: 'none'` suppresses that one write. See
          // ContactWidget/AGENTS.md ("Clipped to the trigger's own bounds").
          const previousClipTransition = panelRef.style.transition;
          panelRef.style.transition = 'none';
          panelRef.style.clipPath = clipFor(closedSize, openSize);
          void panelRef.offsetWidth;
          panelRef.style.transition = previousClipTransition;
          void triggerRef.offsetWidth;
          triggerRef.style.width = `${openRect.width}px`;
          triggerRef.style.height = `${openRect.height}px`;
          triggerRef.setAttribute('data-open', 'true');
          panelRef.style.clipPath = 'inset(0)';
          void waitForTransition(triggerRef, CONTACT_WIDGET_TRANSITION_MS).then(() => {
            if (!untrack(open)) return;
            setContentVisible(true);
          });
        });
        return;
      }
      setContentVisible(false);
      if (!mounted()) return;
      if (!triggerRef || !panelRef || !closedSize || !openSize) {
        setMounted(false);
        return;
      }
      // Re-measure the natural (`auto`) size to shrink back to — the icon is only hidden via
      // `opacity`, which doesn't collapse its contribution to intrinsic size, so this still
      // reads the real closed size even while `data-open` is set. Same clear-measure-restore
      // technique `morphTo` (since deleted) used to use, see `AGENTS.md`.
      const openWidth = triggerRef.style.width;
      const openHeight = triggerRef.style.height;
      triggerRef.style.width = '';
      triggerRef.style.height = '';
      const closedRect = triggerRef.getBoundingClientRect();
      triggerRef.style.width = openWidth;
      triggerRef.style.height = openHeight;
      void triggerRef.offsetWidth;
      triggerRef.removeAttribute('data-open');
      triggerRef.style.width = `${closedRect.width}px`;
      triggerRef.style.height = `${closedRect.height}px`;
      // `panelContent`'s clip-path is currently `inset(0)` (settled open) — a real, single-write
      // change toward the closed clip, so no `transition: 'none'` suppression needed here, only
      // on the open side above (where the *starting* value itself had to be set, not just the
      // target).
      panelRef.style.clipPath = clipFor(closedSize, openSize);
      void waitForTransition(triggerRef, CONTACT_WIDGET_TRANSITION_MS).then(() => {
        if (untrack(open)) return;
        if (triggerRef) {
          triggerRef.style.width = '';
          triggerRef.style.height = '';
        }
        if (panelRef) panelRef.style.clipPath = '';
        setMounted(false);
      });
    });
  });

  // Escape and outside-click only listen while open — re-armed every time `open()` goes true,
  // same pattern `MobileNav` uses for its identical pair.
  createEffect(() => {
    if (!open()) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef?.contains(target) || triggerRef?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <>
      <AppButton
        variant="primary"
        ref={(el) => (triggerRef = el)}
        class={styles.trigger}
        aria-expanded={open() ? 'true' : 'false'}
        aria-controls={panelId}
        aria-label={t().common.contact.triggerLabel}
        onClick={() => setOpen(!open())}
      >
        {/* Painted before `.triggerContent` in DOM order — `position: relative`/`absolute` on
        the two siblings makes stacking follow DOM order, so this stays underneath the icon. See
        ContactWidget/AGENTS.md ("WebKit defers paint transitions bundled with a layout one"). */}
        <div class={styles.triggerFill} />
        <span class={styles.triggerContent}>
          <svg
            aria-hidden="true"
            class={styles.triggerIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </span>
      </AppButton>
      {/* Plain `role="region"`, not `role="dialog"` — this is a non-modal, toggle-controlled
      content region (the same ARIA shape `MobileNav`'s own panel is), not a dialog: no focus
      trap, no `aria-modal`, the rest of the page stays reachable throughout. Painted on top of
      the trigger (see `.panelContent`'s `z-index`) but owns no background/border of its own —
      it's revealed only once the trigger has already grown into the right shape underneath it. */}
      <Show when={mounted()}>
        <div
          id={panelId}
          ref={(el) => (panelRef = el)}
          class={styles.panelContent}
          role="region"
          aria-labelledby={titleId}
          data-visible={contentVisible() ? 'true' : undefined}
        >
          {/* The real-pointer close affordance now that the trigger itself is covered by this
          layer once grown — see ContactWidget/AGENTS.md ("Real-mouse consequence"). */}
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
          <ContactChat />
        </div>
      </Show>
    </>
  );
};
