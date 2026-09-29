import type { Component, ParentProps } from 'solid-js';

import { ConnectivityContext, createConnectivityStore } from './common/libs/connectivity';
import { createLogger, LoggerContext } from './common/libs/logger';
import { RootStoreContext, createRootStore } from './common/libs/stores/root';

export const AppProvider: Component<ParentProps> = (props) => {
  const store = createRootStore();
  const logger = createLogger();
  const connectivity = createConnectivityStore();

  return (
    <LoggerContext.Provider value={logger}>
      <RootStoreContext.Provider value={store}>
        <ConnectivityContext.Provider value={connectivity}>{props.children}</ConnectivityContext.Provider>
      </RootStoreContext.Provider>
    </LoggerContext.Provider>
  );
};
