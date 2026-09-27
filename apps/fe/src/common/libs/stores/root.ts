import { createContext, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

interface User {
  id: string;
  email: string;
}

interface RootState {
  user: User | null;
  isLoading: boolean;
}

export function createRootStore() {
  const [state, setState] = createStore<RootState>({
    user: null,
    isLoading: false,
  });

  return {
    state,
    setUser: (user: User | null) => setState('user', user),
    setLoading: (isLoading: boolean) => setState('isLoading', isLoading),
    logout: () => setState('user', null),
  };
}

export type RootStore = ReturnType<typeof createRootStore>;

export const RootStoreContext = createContext<RootStore>();

export const useRootStore = (): RootStore => {
  const store = useContext(RootStoreContext);
  if (!store) throw new Error('useRootStore must be used within RootStoreContext.Provider');
  return store;
};
