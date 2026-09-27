import './assets/styles/global.css.ts';
import { MetaProvider } from '@solidjs/meta';

import { AppProvider } from './AppProvider';
import { AppRouter } from './views/router';

export default function AppRoot() {
  return (
    <MetaProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </MetaProvider>
  );
}
