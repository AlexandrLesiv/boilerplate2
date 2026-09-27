import { defineJsonLd, defineRoute } from '../../../../common/libs/router';
import { getArticle } from '../api';
import ArticlePage from './ArticlePage';

export const articlePageRoute = defineRoute({
  path: '/news/:id',
  component: ArticlePage,
  preload: ({ params }) => void getArticle(Number(params.id)),
  info: {
    meta: (_, t) => ({
      title: t.pages.news.title,
      description: t.pages.news.description,
      robots: 'noindex',
      schema: defineJsonLd({ '@type': 'NewsArticle', isPartOf: { '@type': 'WebSite' } }),
    }),
  },
});
