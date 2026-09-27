import type { JSX, ParentProps } from 'solid-js';
import { Suspense, untrack } from 'solid-js';

import { MetaProvider } from '@solidjs/meta';
import { A, MemoryRouter, Route, useParams } from '@solidjs/router';

import { generalTheme } from '../src/assets/styles/themes.css';
import { I18nContext, createI18nStore, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../src/common/libs/i18n';
import type { Locale } from '../src/common/libs/i18n';
import { LoggerContext, createLogger } from '../src/common/libs/logger';
import { RootStoreContext, createRootStore } from '../src/common/libs/stores/root';
import { LocaleSwitcher } from '../src/views/components/LocaleSwitcher/LocaleSwitcher';
import { header, headerLeft, main, nav } from '../src/views/layouts/styles.css';

type ProviderOptions = {
  user?: { id: string; email: string } | null;
};

type DecoratorFn = (Story: () => JSX.Element) => JSX.Element;

/**
 * Creates a Storybook-SolidJS decorator factory.
 * The returned HOF produces a decorator with __isJSX=true so the
 * storybook-solidjs-vite adapter skips re-invoking it on re-renders
 * (viewport changes, args updates) — preventing null-owner reactive crashes.
 */
const solidDecorator = (
  render: (Story: () => JSX.Element, opts: ProviderOptions) => JSX.Element,
) => (opts: ProviderOptions = {}): DecoratorFn => {
  const decorator: DecoratorFn = (Story) => render(Story, opts);
  (decorator as unknown as Record<string, unknown>).__isJSX = true;
  return decorator;
};

const AppProviders = (props: { children: JSX.Element; user?: { id: string; email: string } | null }) => {
  const store = createRootStore();
  const initialUser = untrack(() => props.user);
  if (initialUser) store.setUser(initialUser);
  const i18n = createI18nStore(() => DEFAULT_LOCALE);
  const logger = createLogger();

  return (
    <MetaProvider>
      <div class={generalTheme}>
        <LoggerContext.Provider value={logger}>
          <RootStoreContext.Provider value={store}>
            <I18nContext.Provider value={i18n}>{props.children}</I18nContext.Provider>
          </RootStoreContext.Provider>
        </LoggerContext.Provider>
      </div>
    </MetaProvider>
  );
};

/** Lightweight layout for Storybook — visual chrome only, no useCurrentMatches(). */
const StoryPageLayout = (props: ParentProps) => {
  const params = useParams<{ locale?: string }>();
  const locale = () => (params.locale as Locale | undefined) ?? DEFAULT_LOCALE;
  const i18n = createI18nStore(locale);
  const pfx = () => (params.locale ? `/${params.locale}` : '');

  return (
    <I18nContext.Provider value={i18n}>
      <div>
        <header class={header}>
          <div class={headerLeft}>
            <strong>SolidJS App</strong>
            <nav class={nav}>
              <A href={pfx() || '/'} end>
                {i18n.t().nav.home}
              </A>
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
  );
};

/** For component-level stories: contexts + router, no layout chrome. */
export const withAppProviders = solidDecorator((Story, { user = null }) => (
  <AppProviders user={user}>
    <MemoryRouter>
      <Route path="/*" component={() => <Story />} />
    </MemoryRouter>
  </AppProviders>
));

/** For page-level stories: full layout chrome with header, nav, and locale switcher. */
export const withPageLayout = solidDecorator((Story, { user = null }) => (
  <AppProviders user={user}>
    <MemoryRouter>
      <Route path="/:locale?" component={StoryPageLayout} matchFilters={{ locale: [...SUPPORTED_LOCALES] }}>
        <Route path="/*" component={() => <Story />} />
      </Route>
    </MemoryRouter>
  </AppProviders>
));
