import { defineRoute } from '../../../common/libs/router';
import { NotFound } from '../../components/NotFound/NotFound';

/**
 * Catch-all. Must stay last in `appRoutes`, and `noindex` because every unmatched URL lands here —
 * `ErrorState` also sets the response status to 404, so crawlers get the right signal either way.
 */
export const notFoundRoute = defineRoute({
  path: '*',
  component: NotFound,
  info: {
    meta: (_, t) => ({
      title: t.pages.errors['404'].title,
      description: t.pages.errors['404'].description,
      robots: 'noindex, nofollow',
    }),
  },
});
