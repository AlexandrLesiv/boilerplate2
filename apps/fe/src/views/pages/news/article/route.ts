import { defineJsonLd, defineRoute } from '../../../../common/libs/router';
import { getArticle } from '../api';
import ArticlePage from './ArticlePage';

export const articlePageRoute = defineRoute({
  path: '/news/:id',
  component: ArticlePage,
  // Numeric ids only: without this, /news/abc matches and sends `NaN` to the API, which rejects
  // it with a 400. Non-numeric ids now fall through to the catch-all 404 instead.
  matchFilters: { id: /^\d+$/ },
  preload: ({ params }) => void getArticle({ params: { id: Number(params.id) } }),
  info: {
    meta: (_, t) => ({
      title: t.pages.news.title,
      description: t.pages.news.description,
      robots: 'noindex',
      schema: defineJsonLd({ '@type': 'NewsArticle', isPartOf: { '@type': 'WebSite' } }),
    }),
  },
});
