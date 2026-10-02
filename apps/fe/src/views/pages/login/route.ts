import { defineRoute, lazyRoute } from '@/common/libs/router';

// Code-split from the main bundle, same reasoning as `newsRoute`/`articlePageRoute` — most
// visitors never open `/login` directly (it's normally reached via `LoginDialog`'s modal, not
// this full-page route), so there's no reason its markup/styles ship in the eager entry.
// `lazyRoute`, not solid-js's own `lazy()` — see `common/libs/router`'s `ChunkLoadError` doc comment.
const LoginPage = lazyRoute(() => import('./LoginPage'));

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
