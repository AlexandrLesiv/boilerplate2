import type { JSX } from 'solid-js';
import { createEffect, createMemo, createSignal, createUniqueId, onCleanup, Show, untrack } from 'solid-js';

import { runAnimatedClose } from '@/common/libs/dialog/animatedClose';
import { useNativeDialog } from '@/common/libs/dialog/useNativeDialog';
import { flipFrom, flipTo } from '@/common/libs/flip';
import { format, useI18n } from '@/common/libs/i18n';
import { useLogger } from '@/common/libs/logger';
import type { RenderProp } from '@/common/types';

import { LIGHTBOX_TRANSITION_MS } from './constants';
import * as styles from './styles.css';

export interface LightboxItem<T> {
  id: string | number;
  data: T;
  caption?: string;
}

export interface LightboxProps<T> {
  items: LightboxItem<T>[];
  /** `null` = closed. */
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  // Called once per open session (mirrors Dialog's `children`), receiving an accessor so
  // navigating inside the gallery updates in place rather than rebuilding the subtree.
  renderItem: RenderProp<LightboxItem<T>>;
  // Omit to skip the grow-from-thumbnail morph and fall back to a plain fade.
  getTriggerElement?: (id: LightboxItem<T>['id']) => HTMLElement | null | undefined;
}

// Generic component: can't use the `Component<P>` alias (no type-param slot), so this is a plain
// function returning JSX.Element, same shape Solid's compiler expects.
export const Lightbox = <T,>(props: LightboxProps<T>): JSX.Element => {
  const { t } = useI18n();
  const logger = useLogger();
  let contentRef: HTMLDivElement | undefined;

  // `contentInner` (styles.css.ts) sizes itself to the largest box matching this ratio that fits
  // inside `.content` — set from the *actual* trigger's own shape, not hardcoded, since Lightbox
  // can't assume what aspect ratio a consumer's thumbnails use. Without this, `contentInner`'s
  // displayed shape was whatever the viewport's own content area happened to be, which rarely
  // matches the trigger's — forcing the open/close FLIP to choose between landing short of the
  // trigger's exact size on one axis (a uniform scale) or visibly stretching the photo (a
  // non-uniform one). Matching the ratio exactly removes the conflict instead of picking a side.
  // See Lightbox/AGENTS.md.
  const setContentRatio = (rect: { width: number; height: number }) => {
    contentRef?.style.setProperty('--lightbox-ratio', String(rect.width / rect.height));
  };

  // `window.innerWidth`/`innerHeight`, not CSS `100%`/`100vw` — `scrollbar-gutter: stable` on
  // `html` (global.css.ts) shrinks what those units resolve against for this `position: fixed`
  // dialog, which threw off both its own fill and the open/close FLIP math built on top of it
  // (styles.css.ts's `--lightbox-vw`/`-vh`). `window.innerWidth` is unaffected (confirmed live) and
  // writing it only onto this element touches no shared/global state, so — unlike an earlier,
  // reverted attempt that toggled `scrollbar-gutter` itself — nothing on the page reflows and the
  // trigger rect captured alongside it (below) stays accurate.
  const setViewportVars = (el: HTMLElement) => {
    el.style.setProperty('--lightbox-vw', `${window.innerWidth}px`);
    el.style.setProperty('--lightbox-vh', `${window.innerHeight}px`);
  };

  // Memoized, not a plain derived function: `useNativeDialog`'s effect must only react to the
  // open/closed *boundary*, not every index change while already open — a raw `() => activeIndex
  // !== null` would re-track `activeIndex` itself and re-fire showModal/VT-morph logic on every
  // next/prev too. See Lightbox/AGENTS.md.
  const isOpen = createMemo(() => props.activeIndex !== null);

  // Holds the last non-null index, so content stays showing (and the right trigger is still
  // resolvable) while `activeIndex` is `null` during the closing transition.
  const [lastIndex, setLastIndex] = createSignal(untrack(() => props.activeIndex ?? 0));
  const activeItem = createMemo(() => props.items[lastIndex()]);
  const total = () => props.items.length;

  // Navigation while already open swaps content instantly — no shared-geometry morph (aspect
  // ratios rarely match between gallery images, see Lightbox/AGENTS.md) and no transition at
  // all; the grow/shrink FLIP affordance is reserved for open/close only.
  let previousIndex: number | null = untrack(() => props.activeIndex);
  createEffect(() => {
    const next = props.activeIndex;
    const prev = previousIndex;
    previousIndex = next;
    if (prev === null || next === null || prev === next) return;
    // Clears any FLIP transform still in flight on `contentRef` before swapping content —
    // without this, navigating away before the open (or close) animation has finished leaves the
    // *new* image rendering at whatever leftover scale/position the old animation happened to be
    // at, since that transform was computed for the previous image's trigger rect, not this one.
    // Reported live as images appearing at inconsistent, wrong sizes right after using next/prev.
    if (contentRef) {
      // `transition = 'none'` before clearing `transform`, not after — otherwise, if a FLIP
      // transition is still active, clearing `transform` alone would *animate* back to identity
      // over the remaining duration instead of snapping instantly, which is its own visible glitch.
      contentRef.style.transition = 'none';
      contentRef.style.transform = '';
      const triggerRect = props.getTriggerElement?.(props.items[next].id)?.getBoundingClientRect();
      if (triggerRect) setContentRatio(triggerRect);
    }
    setLastIndex(next);
    logger.event('lightbox.navigate', { index: next, total: total() });
  });

  const { setRef, element, mounted, handleNativeClose, handleCancel } = useNativeDialog({
    open: isOpen,
    onClose: () => props.onClose(),
    runTransition: (mutate) => {
      if (isOpen()) {
        const targetIndex = props.activeIndex;
        if (targetIndex === null) return mutate();
        logger.event('lightbox.open', { index: targetIndex, total: total() });
        const targetId = props.items[targetIndex].id;
        const triggerRect = props.getTriggerElement?.(targetId)?.getBoundingClientRect();
        const dialogEl = element();
        if (dialogEl) setViewportVars(dialogEl);
        setLastIndex(targetIndex);
        mutate();
        if (triggerRect) {
          // Deferred to a frame, not a microtask: `mutate()`'s `setMounted(true)` doesn't commit
          // the content div to the DOM synchronously (same reason Dialog defers `showModal()` —
          // see Dialog/AGENTS.md), and a plain `queueMicrotask` races Solid's own internal
          // reactive flush — confirmed live as real, intermittent flakiness: whichever
          // microtask happened to be scheduled first won, so `contentRef` was sometimes not
          // laid out yet when measured, producing a `scale(Infinity)` the browser silently
          // drops, which looks like "no animation, jumps straight to the end state."
          // `requestAnimationFrame` only fires after the browser has committed layout for the
          // current frame — a strictly stronger guarantee than any microtask ordering.
          requestAnimationFrame(() => {
            if (!contentRef) return;
            // Re-measured here, not the `triggerRect` captured above — reported live as a small
            // but real leftover offset, reproducible only when the trigger started partially
            // outside the viewport: a newly-`:focus`ed partially-visible element can get
            // scrolled (fully) into view by the browser's own default focus handling, between
            // the pre-`mutate()` capture above and this frame. Re-reading right before the FLIP
            // math runs keeps it correct regardless of whether that happened, the same
            // staleness-avoidance principle as `setViewportVars`.
            const freshTriggerRect = props.getTriggerElement?.(targetId)?.getBoundingClientRect() ?? triggerRect;
            setContentRatio(freshTriggerRect);
            void flipFrom(contentRef, freshTriggerRect, { durationMs: LIGHTBOX_TRANSITION_MS });
          });
        }
        return;
      }
      // Guards against the hook's own mount-time effect run, which always takes this branch once
      // even when nothing has ever been shown (open starts `false`) — a harmless native no-op in
      // plain Dialog, but pointless here too since there's nothing to animate yet.
      if (!mounted()) return mutate();
      logger.event('lightbox.close', { index: lastIndex(), total: total() });
      const dialogEl = element();
      if (!dialogEl) {
        mutate();
        return;
      }
      // Drives the backdrop fade ourselves (styles.css.ts's `data-closing` rule) and waits for it
      // alongside the content FLIP, calling native `close()` only once both have actually
      // finished — not immediately after starting them. Shared with Dialog's identical
      // close-animation mechanism — see common/libs/dialog/animatedClose.ts and Lightbox/AGENTS.md.
      const triggerRect = props.getTriggerElement?.(activeItem().id)?.getBoundingClientRect();
      const extra: Promise<void>[] = [];
      if (contentRef && triggerRect) {
        // Re-asserted here, not just relied on from open/navigate — this is the ratio `flipTo`
        // measures `contentRef`'s *current* box against a moment from now, so it has to be
        // correct for the item actually being closed, not whatever the last navigate left behind.
        setContentRatio(triggerRect);
        extra.push(flipTo(contentRef, triggerRect, { durationMs: LIGHTBOX_TRANSITION_MS }));
      }
      runAnimatedClose(dialogEl, LIGHTBOX_TRANSITION_MS, mutate, extra);
    },
  });

  // Keeps `--lightbox-vw`/`-vh` live across a resize/orientation-change *while already open* —
  // the open-path write above only covers the moment of opening. Scoped to `isOpen()`, not the
  // component's whole lifetime, so nothing listens while closed.
  createEffect(() => {
    if (!isOpen()) return;
    const dialogEl = element();
    if (!dialogEl) return;
    const handleResize = () => setViewportVars(dialogEl);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  const goTo = (index: number) => {
    const count = total();
    if (count === 0) return;
    props.onNavigate(((index % count) + count) % count);
  };

  // `props.onClose()`, not the raw `close()` handle `useNativeDialog` returns — `close()` calls
  // native `ref.close()` immediately, bypassing the reactive effect that drives the animated
  // close sequence above (`data-closing`, `flipTo`, the `Promise.all` wait) entirely. By the time
  // that effect notices `isOpen()` went false, `ref.open` would already be false and its own
  // guard would skip the whole animation — confirmed live as the close animation never running at
  // all, in any browser, not an engine-specific timing issue. Routing through `onClose` instead
  // lets the parent flip `activeIndex` to `null` first, so the effect sees `ref.open` still `true`
  // and runs the real animated close, only calling native `close()` itself once that finishes.
  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === element()) props.onClose();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(lastIndex() + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(lastIndex() - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goTo(total() - 1);
    }
  };

  const captionId = createUniqueId();

  return (
    <dialog
      ref={setRef}
      class={styles.dialog}
      aria-label={t().common.lightbox.label}
      aria-describedby={activeItem()?.caption ? captionId : undefined}
      onClose={handleNativeClose}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <Show when={mounted()}>
        <div class={styles.content}>
          <div class={styles.contentInner} ref={(el) => (contentRef = el)}>
            {props.renderItem(activeItem)}
          </div>
        </div>
        <Show when={activeItem().caption}>
          {(caption) => (
            <p id={captionId} class={styles.caption}>
              {caption()}
            </p>
          )}
        </Show>
      </Show>
      <button
        type="button"
        class={styles.closeButton}
        onClick={() => props.onClose()}
        aria-label={t().common.lightbox.close}
      >
        <span aria-hidden="true">&times;</span>
      </button>
      <Show when={total() > 1}>
        <button
          type="button"
          class={styles.prevButton}
          onClick={() => goTo(lastIndex() - 1)}
          aria-label={t().common.lightbox.prev}
        >
          <span aria-hidden="true">&lsaquo;</span>
        </button>
        <button
          type="button"
          class={styles.nextButton}
          onClick={() => goTo(lastIndex() + 1)}
          aria-label={t().common.lightbox.next}
        >
          <span aria-hidden="true">&rsaquo;</span>
        </button>
        <p class={styles.counter} aria-live="polite">
          {format(t().common.lightbox.counter, { current: lastIndex() + 1, total: total() })}
        </p>
      </Show>
    </dialog>
  );
};
