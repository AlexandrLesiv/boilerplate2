import type { Component, ParentProps } from 'solid-js';

import { RootStoreContext, createRootStore } from './common/libs/stores/root';

export const AppProvider: Component<ParentProps> = (props) => {
  const store = createRootStore();
  return <RootStoreContext.Provider value={store}>{props.children}</RootStoreContext.Provider>;
};
