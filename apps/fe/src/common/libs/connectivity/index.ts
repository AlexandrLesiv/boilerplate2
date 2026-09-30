import { createContext, createSignal, onCleanup, onMount, useContext } from 'solid-js';

import type { Logger } from '../logger';

export type ConnectivityState = 'online' | 'offline' | 'reconnected';

const RECONNECTED_MESSAGE_MS = 4000;

/**
 * `navigator.onLine` and the `online`/`offline` events only reflect whether a network interface
 * is connected, not whether it can reach the internet — a device on a dead Wi-Fi network still
 * reports `true`. This is a hint for the UI, not something the rest of the app gates real
 * behavior on.
 *
 * Takes `logger` as a parameter rather than `useLogger()`: this is called from `AppProvider`'s
 * own body, before it renders `LoggerContext.Provider` — at that point `AppProvider` is not yet
 * a descendant of its own provider, so the hook has nothing to find. `AppProvider` already holds
 * the real logger locally (from `createLogger()`); passing it in is simpler than restructuring
 * this into a rendered child component the way `WebVitalsMonitor` is.
 */
export const createConnectivityStore = (logger: Logger) => {
  const [state, setState] = createSignal<ConnectivityState>('online');

  onMount(() => {
    let reconnectedTimer: ReturnType<typeof setTimeout> | undefined;

    const handleOffline = () => {
      clearTimeout(reconnectedTimer);
      setState('offline');
      logger.info('connectivity.offline');
    };
    const handleOnline = () => {
      logger.info('connectivity.online');
      setState('reconnected');
      reconnectedTimer = setTimeout(() => setState('online'), RECONNECTED_MESSAGE_MS);
    };

    if (!navigator.onLine) handleOffline();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    onCleanup(() => {
      clearTimeout(reconnectedTimer);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    });
  });

  return { state };
};

export type ConnectivityStore = ReturnType<typeof createConnectivityStore>;

export const ConnectivityContext = createContext<ConnectivityStore>();

export const useConnectivity = (): ConnectivityStore => {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) throw new Error('useConnectivity must be used within ConnectivityContext.Provider');
  return ctx;
};
