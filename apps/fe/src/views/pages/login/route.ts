import { defineRoute } from '@/common/libs/router';

import LoginPage from './LoginPage';

export const loginRoute = defineRoute({
  path: '/login',
  component: LoginPage,
  info: {
    meta: (_, t) => ({
      title: t.pages.login.title,
      description: t.pages.login.title,
      robots: 'noindex, nofollow',
    }),
  },
});
