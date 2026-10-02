import type { Component, ParentProps } from 'solid-js';

import { createAsync } from '@solidjs/router';

import { ConnectivityContext, createConnectivityStore } from './common/libs/connectivity';
import { createLogger, LoggerContext } from './common/libs/logger';
import { RootStoreContext, createRootStore } from './common/libs/stores/root';
import { WebVitalsMonitor } from './common/libs/web-vitals/WebVitalsMonitor';

export const AppProvider: Component<ParentProps> = (props) => {
  const store = createRootStore();
  // `createAsync` doesn't need router context — verified live (dev and a real production preview
  // build) against an earlier, wrong assumption elsewhere in this codebase that it did. In a real
  // production build the resolved value is available synchronously right here, on this same line:
  // hydration replays the SSR-generated id (Node's `crypto.randomUUID()`, never secure-context
  // gated) before this read happens. Dev mode resolves one tick later instead, so very early logs
  // in a dev session only may show an empty session id for that page load — not a concern in
  // production, where this never observably differs from a plain synchronous value.
  const sessionId = createAsync(async () => crypto.randomUUID());
  const logger = createLogger(sessionId() ?? '');
  const connectivity = createConnectivityStore(logger);

  return (
    <LoggerContext.Provider value={logger}>
      <RootStoreContext.Provider value={store}>
        <ConnectivityContext.Provider value={connectivity}>
          <WebVitalsMonitor />
          {props.children}
        </ConnectivityContext.Provider>
      </RootStoreContext.Provider>
    </LoggerContext.Provider>
  );
};
