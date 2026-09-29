import type { Component, JSX } from 'solid-js';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

import * as styles from './styles.css';

type Stage = 'hidden' | 'loading' | 'slow';

/** Below this, nothing renders — a load this fast reads as instant, and a flashed indicator would
 * itself look like a glitch. Nielsen's response-time research puts the threshold for "no special
 * feedback necessary" at ~0.1s and "user notices the delay but flow of thought stays intact" at
 * ~1s; this waits for the latter before showing anything. */
export const DEFAULT_DELAY_MS = 1000;

/** At/after this, `longLoading` joins `loading` rather than replacing it — reassurance once a
 * wait has clearly left the "just a moment" range, without waiting for Nielsen's full 10s
 * attention limit. */
export const DEFAULT_SLOW_MS = 5000;

export interface TimedRevealProps {
  /** Shown once `delayMs` elapses, for as long as this stays mounted. */
  loading: JSX.Element;
  /** Shown alongside `loading` once `slowMs` elapses. */
  longLoading: JSX.Element;
  delayMs?: number;
  slowMs?: number;
}

/**
 * Pure timing orchestration — decides *when* to reveal caller-supplied content, with no look of
 * its own. `TimedLoader` (`views/components/`) is the concrete skin built on this; anything else
 * that needs a "nothing → something → something more urgent" staged reveal can reuse this
 * directly instead of duplicating the timer/cleanup logic.
 *
 * The `role="status"` region mounts immediately regardless of stage, with only its content
 * swapped — a live region only reliably announces changes to screen readers if it already
 * existed in the DOM before the change, not one inserted at the same time as the update.
 */
export const TimedReveal: Component<TimedRevealProps> = (props) => {
  const [stage, setStage] = createSignal<Stage>('hidden');

  onMount(() => {
    const delayTimer = setTimeout(() => setStage('loading'), props.delayMs ?? DEFAULT_DELAY_MS);
    const slowTimer = setTimeout(() => setStage('slow'), props.slowMs ?? DEFAULT_SLOW_MS);

    onCleanup(() => {
      clearTimeout(delayTimer);
      clearTimeout(slowTimer);
    });
  });

  return (
    <div role="status" aria-live="polite" aria-busy="true" class={styles.container}>
      <Show when={stage() !== 'hidden'}>{props.loading}</Show>
      <Show when={stage() === 'slow'}>{props.longLoading}</Show>
    </div>
  );
};
