import { defineRoute } from '../../../common/libs/router';
import Root from './Root';

export const rootRoute = defineRoute({
  path: '',
  component: Root,
  info: {
    meta: (_, t) => ({
      title: t.pages.home.title,
      description: t.pages.home.welcomeAnon,
    }),
  },
});
