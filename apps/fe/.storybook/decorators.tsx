import type { JSX, ParentProps } from 'solid-js';
import { untrack } from 'solid-js';

import { MetaProvider } from '@solidjs/meta';
import { MemoryRouter, Route } from '@solidjs/router';

import { generalTheme } from '../src/assets/styles/themes.css';
import { I18nContext, createI18nStore, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../src/common/libs/i18n';
import type { Locale } from '../src/common/libs/i18n';
import { LoggerContext, createLogger } from '../src/common/libs/logger';
import { RootStoreContext, createRootStore } from '../src/common/libs/stores/root';
import RootLayout from '../src/views/layouts/RootLayout';

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

// Static providers that don't need router context.
const AppProviders = (props: { children: JSX.Element; user?: { id: string; email: string } | null }) => {
  const store = createRootStore();
  const initialUser = untrack(() => props.user);
  if (initialUser) store.setUser(initialUser);
  const logger = createLogger();

  return (
    <MetaProvider>
      <div class={generalTheme}>
        <LoggerContext.Provider value={logger}>
          <RootStoreContext.Provider value={store}>
            {props.children}
          </RootStoreContext.Provider>
        </LoggerContext.Provider>
      </div>
    </MetaProvider>
  );
};

// createI18nStore uses createAsync which requires router context — must render inside a Route.
const WithI18n = (props: ParentProps & { locale?: () => Locale }) => {
  const i18n = createI18nStore(props.locale ?? (() => DEFAULT_LOCALE));
  return <I18nContext.Provider value={i18n}>{props.children}</I18nContext.Provider>;
};

/** For component-level stories: contexts + router, no layout chrome. */
export const withAppProviders = solidDecorator((Story, { user = null }) => (
  <AppProviders user={user}>
    <MemoryRouter>
      <Route path="/*" component={() => (
        <WithI18n>
          <Story />
        </WithI18n>
      )} />
    </MemoryRouter>
  </AppProviders>
));

/** For page-level stories: full app layout (RootLayout) so nav stays in sync with the real app. */
export const withPageLayout = solidDecorator((Story, { user = null }) => (
  <AppProviders user={user}>
    <MemoryRouter>
      <Route path="/:locale?" component={RootLayout} matchFilters={{ locale: [...SUPPORTED_LOCALES] }}>
        <Route path="/*" component={() => <Story />} />
      </Route>
    </MemoryRouter>
  </AppProviders>
));
