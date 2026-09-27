import type { RouteDefinition } from '@solidjs/router';

import { SUPPORTED_LOCALES, loadLocale, localeFromParams } from '../common/libs/i18n';
import RootLayout from './layouts/RootLayout';
import { loginRoute } from './pages/login/route';
import { articlePageRoute } from './pages/news/article/route';
import { newsRoute } from './pages/news/route';
import { rootRoute } from './pages/root/route';

export const appRoutes: RouteDefinition[] = [
  {
    path: '/:locale?',
    component: RootLayout,
    matchFilters: { locale: [...SUPPORTED_LOCALES] },
    preload: ({ params }) => void loadLocale(localeFromParams(params)),
    children: [rootRoute, newsRoute, articlePageRoute, loginRoute],
  },
];
