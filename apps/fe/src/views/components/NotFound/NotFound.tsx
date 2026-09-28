import type { Component } from 'solid-js';
import { getRequestEvent, isServer } from 'solid-js/web';

import { A, useParams } from '@solidjs/router';

import { useI18n } from '../../../common/libs/i18n';

// Set synchronously during render rather than via `setResponseStatus`, which lives in
// `@solidjs/start/http` and would pull h3 into the client bundle. Only takes effect because
// `src/middleware.ts` initialises `res.status` first.
const markNotFound = () => {
  if (!isServer) return;
  const res = getRequestEvent()?.nativeEvent.res;
  if (res && res.status !== undefined) res.status = 404;
};

export const NotFound: Component = () => {
  const { t } = useI18n();
  const params = useParams<{ locale?: string }>();

  markNotFound();

  return (
    <div>
      <h1>{t().pages.notFound.title}</h1>
      <p>{t().pages.notFound.description}</p>
      <A href={params.locale ? `/${params.locale}` : '/'}>{t().pages.notFound.backHome}</A>
    </div>
  );
};
