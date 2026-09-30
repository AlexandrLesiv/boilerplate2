import type { Component, ParentProps } from 'solid-js';

import { ConnectivityContext, createConnectivityStore } from './common/libs/connectivity';
import { createLogger, LoggerContext } from './common/libs/logger';
import { RootStoreContext, createRootStore } from './common/libs/stores/root';
import { WebVitalsMonitor } from './common/libs/web-vitals/WebVitalsMonitor';

export const AppProvider: Component<ParentProps> = (props) => {
  const store = createRootStore();
  const logger = createLogger();
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
