import type { Component, ParentProps } from 'solid-js';
import { For, Show, Suspense, createEffect } from 'solid-js';

import { Link, Meta, Title } from '@solidjs/meta';
import { A, useCurrentMatches, useLocation, useParams } from '@solidjs/router';

import { ConfigContext, createConfigStore } from '@/common/libs/config';
import {
  I18nContext,
  createI18nStore,
  SUPPORTED_LOCALES,
  localeFromParams,
  localePath,
  stripLocale,
} from '@/common/libs/i18n';
import type { Locale } from '@/common/libs/i18n';
import type { AppRouteInfo } from '@/common/libs/router';
import { JsonLd } from '@/common/libs/seo/JsonLd';

import { LocaleSwitcher } from '../components/LocaleSwitcher/LocaleSwitcher';
import { OfflineStatus } from '../containers/OfflineStatus/OfflineStatus';
import * as styles from './styles.css';

const RootLayout: Component<ParentProps> = (props) => {
  const params = useParams<{ locale?: string }>();
  const location = useLocation();
  const matches = useCurrentMatches();
  const locale = () => localeFromParams(params);
  createEffect(() => {
    document.documentElement.lang = locale();
  });
  const i18n = createI18nStore(locale);
  // Not in AppProvider: createAsync needs router context and AppProvider sits above the router.
  const config = createConfigStore();
  // Reads the store directly: this component provides ConfigContext, so it cannot consume it.
  const features = () => config.config().features;
  const pfx = () => (params.locale ? `/${params.locale}` : '');

  const pagePath = () => stripLocale(location.pathname, params.locale);

  const alternateHref = (target: Locale) => localePath(pagePath(), target);

  const routeMeta = () => {
    const match = matches().findLast((m) => m.route.info?.meta);
    const info = match?.route.info as AppRouteInfo<undefined> | undefined;
    return info ? info.meta(undefined, i18n.t()) : null;
  };

  return (
    <ConfigContext.Provider value={config}>
      <I18nContext.Provider value={i18n}>
        <Link rel="manifest" href="/manifest.json" />
        <Link rel="icon" href="/assets/favicon/favicon.ico" sizes="any" />
        <Link rel="icon" type="image/svg+xml" href="/assets/favicon/favicon.svg" />
        <Link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png" />
        <Link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png" />
        <Link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon-180x180.png" />
        <Link rel="apple-touch-icon" href="/assets/favicon/apple-touch-icon.png" />
        <Meta name="msapplication-config" content="/assets/favicon/browserconfig.xml" />
        <Meta name="theme-color" content="#3b82f6" />
        <For each={SUPPORTED_LOCALES}>
          {(target) => <Link rel="alternate" hreflang={target} href={alternateHref(target)} />}
        </For>
        <Link rel="alternate" hreflang="x-default" href={pagePath()} />

        <Suspense>
          <Show when={routeMeta()?.title}>
            <Title>{routeMeta()!.title}</Title>
          </Show>
          <Show when={routeMeta()?.description}>
            <Meta name="description" content={routeMeta()!.description!} />
          </Show>
          <Show when={routeMeta()?.robots}>
            <Meta name="robots" content={routeMeta()!.robots!} />
          </Show>
          <Link rel="canonical" href={routeMeta()?.canonical ?? pagePath()} />
          <Show when={routeMeta()?.schema}>{(schema) => <JsonLd schema={schema()} />}</Show>
        </Suspense>

        {/* Required: Suspense waits on loading resources even when they have an initialValue.
            Without it the nav's t() renders once server-side as the en default. */}
        <Suspense>
          <div>
            <header class={styles.header}>
              <div class={styles.headerLeft}>
                <strong>SolidJS App</strong>
                <nav class={styles.nav}>
                  <A href={pfx() || '/'} end>
                    {i18n.t().nav.home}
                  </A>
                  <A href={`${pfx()}/news`}>{i18n.t().nav.news}</A>
                  <A href={`${pfx()}/login`}>{i18n.t().nav.login}</A>
                </nav>
              </div>
              <Show when={features().localeSwitcher}>
                <LocaleSwitcher />
              </Show>
            </header>
            <OfflineStatus />
            <main class={styles.main}>
              <Suspense>{props.children}</Suspense>
            </main>
          </div>
        </Suspense>
      </I18nContext.Provider>
    </ConfigContext.Provider>
  );
};

export default RootLayout;
