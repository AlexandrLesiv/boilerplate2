import type { Component } from 'solid-js';

import { Meta, Title } from '@solidjs/meta';

import { useI18n } from '@/common/libs/i18n';

import { ErrorState } from '../ErrorState/ErrorState';

/**
 * The 404 page for any unmatched URL (the catch-all route). `noindex` because every unmatched URL
 * lands here — `ErrorState` also sets the response status to 404, so crawlers get the right
 * signal either way. Not shared with `DataBoundary`'s own 404 rendering (a *data* 404, e.g. a
 * missing article id) — that goes through `ErrorFallback` directly, never this component, so its
 * meta doesn't leak onto pages whose route matched fine but whose data didn't.
 */
export const NotFound: Component = () => {
  const { t } = useI18n();
  return (
    <>
      <Title>{t().pages.errors['404'].title}</Title>
      <Meta name="description" content={t().pages.errors['404'].description} />
      <Meta name="robots" content="noindex, nofollow" />
      <ErrorState kind="404" />
    </>
  );
};
