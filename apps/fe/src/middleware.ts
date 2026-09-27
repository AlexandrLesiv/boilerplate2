import { createMiddleware } from '@solidjs/start/middleware';

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './common/libs/i18n';
import type { Locale } from './common/libs/i18n';

export default createMiddleware({
  onRequest: [
    (event) => {
      const first = new URL(event.request.url).pathname.split('/')[1] ?? '';
      event.locals.lang = SUPPORTED_LOCALES.includes(first as Locale) ? first : DEFAULT_LOCALE;
    },
  ],
});
