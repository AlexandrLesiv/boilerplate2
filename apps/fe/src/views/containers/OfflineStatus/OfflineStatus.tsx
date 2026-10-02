import type { Component } from 'solid-js';
import { Match, Switch } from 'solid-js';

import { useConnectivity } from '@/common/libs/connectivity';
import { useI18n } from '@/common/libs/i18n';

import * as styles from './styles.css';

/**
 * Reads connectivity state from `ConnectivityContext` rather than listening to `window` itself —
 * the store owns the `navigator.onLine`/event-listener lifecycle once, in `AppProvider`, so this
 * component (and any other consumer) is a plain reactive read with no browser API of its own.
 *
 * The outer `role="status"` region stays mounted regardless of state, with only its text content
 * swapped — screen readers only pick up changes reliably inside a live region that already
 * existed in the DOM before the change, not one inserted at the same time as the update.
 */
export const OfflineStatus: Component = () => {
  const { t } = useI18n();
  const { state } = useConnectivity();

  return (
    <div role="status" aria-live="polite" class={styles.region}>
      <Switch>
        <Match when={state() === 'offline'}>
          <p class={styles.offline}>{t().common.offline.message}</p>
        </Match>
        <Match when={state() === 'reconnected'}>
          <p class={styles.reconnected}>{t().common.offline.backOnline}</p>
        </Match>
      </Switch>
    </div>
  );
};
