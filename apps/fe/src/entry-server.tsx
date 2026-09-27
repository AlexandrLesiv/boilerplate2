import { getRequestEvent } from 'solid-js/web';

import { createHandler, StartServer } from '@solidjs/start/server';

import { generalTheme } from './assets/styles/themes.css';
import { DEFAULT_LOCALE } from './common/libs/i18n';

export default createHandler(() => {
  const lang = getRequestEvent()?.locals.lang ?? DEFAULT_LOCALE;
  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang={lang} class={generalTheme}>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
            <title>SolidJS App</title>
            {assets}
          </head>
          <body>
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  );
});
