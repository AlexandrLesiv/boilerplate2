import type { Component, ParentProps } from 'solid-js';
import { For, Show, Suspense, createEffect } from 'solid-js';

import { Link, Meta, Title } from '@solidjs/meta';
import { A, useCurrentMatches, useLocation, useParams } from '@solidjs/router';

import { ApiContext, createApi } from '../../common/libs/fetch';
import { I18nContext, createI18nStore, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../../common/libs/i18n';
import type { Locale } from '../../common/libs/i18n';
import type { AppRouteInfo } from '../../common/libs/router';
import { LocaleSwitcher } from '../components/LocaleSwitcher/LocaleSwitcher';
import { header, headerLeft, main, nav } from './styles.css';

const RootLayout: Component<ParentProps> = (props) => {
  const params = useParams<{ locale?: string }>();
  const location = useLocation();
  const matches = useCurrentMatches();
  const locale = () => (params.locale as Locale | undefined) ?? DEFAULT_LOCALE;
  createEffect(() => {
    document.documentElement.lang = locale();
  });
  const api = createApi({ getLocale: locale });
  const i18n = createI18nStore(locale);
  const pfx = () => (params.locale ? `/${params.locale}` : '');

  const pagePath = () => {
    const currentLocale = params.locale as Locale | undefined;
    return currentLocale ? location.pathname.slice(`/${currentLocale}`.length) || '/' : location.pathname;
  };

  const alternateHref = (target: Locale) =>
    target === DEFAULT_LOCALE ? pagePath() : `/${target}${pagePath() === '/' ? '' : pagePath()}`;

  const routeMeta = () => {
    const match = matches().findLast((m) => m.route.info?.meta);
    const info = match?.route.info as AppRouteInfo<undefined> | undefined;
    return info ? info.meta(undefined, i18n.t()) : null;
  };

  return (
    <ApiContext.Provider value={api}>
    <I18nContext.Provider value={i18n}>
      <Link rel="manifest" href="/manifest.json" />
      <Meta name="theme-color" content="#3b82f6" />
      <For each={SUPPORTED_LOCALES}>
        {(target) => <Link rel="alternate" hreflang={target} href={alternateHref(target)} />}
      </For>
      <Link rel="alternate" hreflang="x-default" href={pagePath()} />

      <Suspense>
        <Title>{routeMeta()?.title ?? ''}</Title>
        <Show when={routeMeta()?.description}>
          <Meta name="description" content={routeMeta()!.description!} />
        </Show>
        <Show when={routeMeta()?.robots}>
          <Meta name="robots" content={routeMeta()!.robots!} />
        </Show>
        <Link rel="canonical" href={routeMeta()?.canonical ?? pagePath()} />
      </Suspense>

      <div>
        <header class={header}>
          <div class={headerLeft}>
            <strong>SolidJS App</strong>
            <nav class={nav}>
              <A href={pfx() || '/'} end>
                {i18n.t().nav.home}
              </A>
              <A href={`${pfx()}/news`}>{i18n.t().nav.news}</A>
              <A href={`${pfx()}/login`}>{i18n.t().nav.login}</A>
            </nav>
          </div>
          <LocaleSwitcher />
        </header>
        <main class={main}>
          <Suspense>{props.children}</Suspense>
        </main>
      </div>
    </I18nContext.Provider>
    </ApiContext.Provider>
  );
};

export default RootLayout;
