import type { Component } from 'solid-js';

import { useI18n } from '@/common/libs/i18n';
import { TimedReveal } from '@/views/containers/TimedReveal/TimedReveal';

import * as styles from './styles.css';

export interface TimedLoaderProps {
  delayMs?: number;
  slowMs?: number;
}

/**
 * The concrete "loading" skin on `TimedReveal` — a spinner and copy, staged by elapsed time
 * rather than shown unconditionally the instant loading starts. There is deliberately no switch
 * to a determinate progress bar past `slowMs`: a single request/response fetch has no real
 * progress fraction to report, and a fake one would cost more trust than it buys once users learn
 * it doesn't move at a believable rate.
 */
export const TimedLoader: Component<TimedLoaderProps> = (props) => {
  const { t } = useI18n();

  return (
    <TimedReveal
      delayMs={props.delayMs}
      slowMs={props.slowMs}
      loading={
        <>
          <span class={styles.spinner} aria-hidden="true" />
          <p class={styles.message}>{t().common.loading}</p>
        </>
      }
      longLoading={<p class={styles.slowMessage}>{t().common.loadingSlow}</p>}
    />
  );
};
