import './assets/styles/global.css.ts';
import { MetaProvider } from '@solidjs/meta';

import { AppProvider } from './AppProvider';
import { DedupedMetaProvider } from './common/libs/seo/DedupedMetaProvider';
import { AppRouter } from './views/router';

export default function AppRoot() {
  return (
    <MetaProvider>
      <DedupedMetaProvider>
        <AppProvider>
          <AppRouter />
        </AppProvider>
      </DedupedMetaProvider>
    </MetaProvider>
  );
}
