import { defineJsonLd, defineRoute } from '../../../common/libs/router';
import { getTopStories } from './api';
import NewsPage from './NewsPage';

export { getTopStories } from './api';

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
