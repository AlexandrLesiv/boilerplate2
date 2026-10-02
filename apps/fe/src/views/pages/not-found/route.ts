import { defineRoute } from '@/common/libs/router';
import { NotFound } from '@/views/containers/NotFound/NotFound';

/** Catch-all. Must stay last in `appRoutes` — see `NotFound.tsx` for its meta/`noindex`. */
export const notFoundRoute = defineRoute({
  path: '*',
  component: NotFound,
});
