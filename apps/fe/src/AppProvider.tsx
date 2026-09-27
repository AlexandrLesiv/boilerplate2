import type { Component, ParentProps } from 'solid-js';

import { logger, LoggerContext } from './common/libs/logger';
import { RootStoreContext, createRootStore } from './common/libs/stores/root';

export const AppProvider: Component<ParentProps> = (props) => {
  const store = createRootStore();

  return (
    <LoggerContext.Provider value={logger}>
      <RootStoreContext.Provider value={store}>{props.children}</RootStoreContext.Provider>
    </LoggerContext.Provider>
  );
};
