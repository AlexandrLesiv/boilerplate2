import { defineRoute } from '../../../common/libs/router';
import NewsPage from './NewsPage';

export const newsRoute = defineRoute({
  path: '/news',
  component: NewsPage,
  info: {
    meta: (_, t) => ({
      title: t.pages.news.title,
      description: t.pages.news.description,
    }),
  },
});
