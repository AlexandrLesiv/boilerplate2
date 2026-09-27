import { createMiddleware } from '@solidjs/start/middleware';

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './common/libs/i18n';
import type { Locale } from './common/libs/i18n';

export default createMiddleware({
  onRequest: [
    (event) => {
      // Exactly one URL per page: the slash-free form, which is what the route
      // definitions, canonical and hreflang tags all emit. Without this, /news and
      // /news/ both render 200 — two indexable URLs for one page. Root is exempt,
      // since "/" is itself the slash-free form.
      const url = new URL(event.request.url);
      if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
        const pathname = url.pathname.replace(/\/+$/, '') || '/';
        return new Response(null, {
          status: 301,
          headers: { location: `${pathname}${url.search}` },
        });
      }

      // H3EventResponse.status starts as undefined (uninitialized class field),
      // which breaks setResponseStatus()'s `!== undefined` guard. Initialize it
      // here so any downstream call to setResponseStatus() takes effect.
      event.nativeEvent.res.status = 200;

      const first = url.pathname.split('/')[1] ?? '';
      event.locals.lang = SUPPORTED_LOCALES.includes(first as Locale) ? first : DEFAULT_LOCALE;
    },
  ],
});
