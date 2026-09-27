import { topStoriesRoute } from '@repo/shared';

import { createApiCall } from '../../../common/libs/api';
import { localeFromParams } from '../../../common/libs/i18n';
import { defineJsonLd, defineRoute } from '../../../common/libs/router';
import NewsPage from './NewsPage';

export const getTopStories = createApiCall(topStoriesRoute);

export const newsRoute = defineRoute({
  path: '/news',
  component: NewsPage,
  preload: ({ params }) => void getTopStories(localeFromParams(params)),
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
