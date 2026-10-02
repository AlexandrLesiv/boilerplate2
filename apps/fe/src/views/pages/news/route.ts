import { defineJsonLd, defineRoute, lazyRoute } from '@/common/libs/router';

import { getTopStories } from './api';

export { getTopStories } from './api';

// Code-split from the main bundle — `./api` (the actual preloaded data fetch, above) is a
// separate, tiny module, so this doesn't delay `preload` below; only the page's own component
// code (styles, markup) loads lazily, on first navigation to `/news`. `lazyRoute`, not solid-js's
// own `lazy()` — see `common/libs/router`'s `ChunkLoadError` doc comment.
const NewsPage = lazyRoute(() => import('./NewsPage'));

export const newsRoute = defineRoute({
  path: '/news',
  component: NewsPage,
  preload: () => void getTopStories(),
  info: {
    meta: (_, t) => ({
      title: t.pages.news.title,
      description: t.pages.news.description,
      schema: defineJsonLd({
        '@type': 'CollectionPage',
        name: t.pages.news.title,
        description: t.pages.news.description,
      }),
    }),
  },
});
