import type { JSX, ParentProps } from 'solid-js';
import { onMount, untrack } from 'solid-js';

import { MetaProvider } from '@solidjs/meta';
import { MemoryRouter, Route, createMemoryHistory, query } from '@solidjs/router';

import type { ClientConfig } from '@repo/shared';

import { AppProvider } from '@/AppProvider';
import { generalTheme } from '@/assets/styles/themes.css';
import { ConfigContext, createConfigStore } from '@/common/libs/config';
import { ConnectivityContext, createConnectivityStore } from '@/common/libs/connectivity';
import { I18nContext, createI18nStore, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/common/libs/i18n';
import type { Locale } from '@/common/libs/i18n';
import { LoggerContext, createLogger } from '@/common/libs/logger';
import { DedupedMetaProvider } from '@/common/libs/seo/DedupedMetaProvider';
import { RootStoreContext, createRootStore } from '@/common/libs/stores/root';
import RootLayout from '@/views/layouts/RootLayout';
import { appRoutes } from '@/views/routes';

import { setClientConfigOverrides } from './mocks/handlers/config';

type ProviderOptions = {
  user?: { id: string; email: string } | null;
  /** Route pattern the story is mounted at. Set it when the component reads route params. */
  path?: string;
  /** Initial in-memory URL. Must match `path` so `useParams()` resolves. */
  initialPath?: string;
  /** Locale for component stories. `withPageLayout` derives it from the URL instead. */
  locale?: Locale;
};

type DecoratorFn = (Story: () => JSX.Element) => JSX.Element;

/**
 * Creates a Storybook-SolidJS decorator factory.
 * The returned HOF produces a decorator with __isJSX=true so the
 * storybook-solidjs-vite adapter skips re-invoking it on re-renders
 * (viewport changes, args updates) — preventing null-owner reactive crashes.
 */
const solidDecorator =
  (render: (Story: () => JSX.Element, opts: ProviderOptions) => JSX.Element) =>
  (opts: ProviderOptions = {}): DecoratorFn => {
    const decorator: DecoratorFn = (Story) => render(Story, opts);
    (decorator as unknown as Record<string, unknown>).__isJSX = true;
    return decorator;
  };

/** Seeds the in-memory history so param-driven stories start on the right URL. */
const createStoryHistory = (initialPath?: string) => {
  if (!initialPath) return undefined;
  const history = createMemoryHistory();
  history.set({ value: initialPath, replace: true });
  return history;
};

// Static providers that don't need router context.
const AppProviders = (props: { children: JSX.Element; user?: { id: string; email: string } | null }) => {
  const store = createRootStore();
  const initialUser = untrack(() => props.user);
  if (initialUser) store.setUser(initialUser);
  const logger = createLogger(crypto.randomUUID());
  const connectivity = createConnectivityStore(logger);

  return (
    <MetaProvider>
      <div class={generalTheme}>
        <LoggerContext.Provider value={logger}>
          <RootStoreContext.Provider value={store}>
            <ConnectivityContext.Provider value={connectivity}>{props.children}</ConnectivityContext.Provider>
          </RootStoreContext.Provider>
        </LoggerContext.Provider>
      </div>
    </MetaProvider>
  );
};

// createI18nStore uses createAsync which requires router context — must render inside a Route.
const WithI18n = (props: ParentProps & { locale?: () => Locale }) => {
  const i18n = createI18nStore(() => props.locale?.() ?? DEFAULT_LOCALE);
  return <I18nContext.Provider value={i18n}>{props.children}</I18nContext.Provider>;
};

// Same constraint as WithI18n. withPageLayout gets this from RootLayout instead. Stories set
// flag values via the MSW handler in `.storybook/mocks/handlers/config.ts`.
const WithConfig = (props: ParentProps) => {
  const config = createConfigStore();
  return <ConfigContext.Provider value={config}>{props.children}</ConfigContext.Provider>;
};

/** For component-level stories: contexts + router, no layout chrome. */
export const withAppProviders = solidDecorator((Story, { user = null, path = '/*', initialPath, locale }) => (
  <AppProviders user={user}>
    <MemoryRouter history={createStoryHistory(initialPath)}>
      <Route
        path={path}
        component={() => (
          <WithI18n locale={() => locale ?? DEFAULT_LOCALE}>
            <WithConfig>
              <Story />
            </WithConfig>
          </WithI18n>
        )}
      />
    </MemoryRouter>
  </AppProviders>
));

/** For page-level stories: full app layout (RootLayout) so nav stays in sync with the real app. */
export const withPageLayout = solidDecorator((Story, { user = null, path = '/*', initialPath }) => (
  <AppProviders user={user}>
    <MemoryRouter history={createStoryHistory(initialPath)}>
      <Route path="/:locale?" component={RootLayout} matchFilters={{ locale: [...SUPPORTED_LOCALES] }}>
        <Route path={path} component={() => <Story />} />
      </Route>
    </MemoryRouter>
  </AppProviders>
));

export interface FullAppProps {
  /** Locale-prefixed path to boot at, e.g. `/ua/news`. */
  path?: string;
  /** Feature flag overrides the mocked config endpoint should serve. */
  features?: Partial<ClientConfig['features']>;
  /** Simulates the browser going offline right after boot, via a real `window` `offline` event. */
  offline?: boolean;
}

/**
 * The whole application, navigable. Uses the real `AppProvider` and the real `appRoutes`, so the
 * only difference from `src/App.tsx` is MemoryRouter instead of Router — Storybook's iframe URL
 * is not an app route. Pair with `allHandlers` so every endpoint answers.
 *
 * Used as a story `render`, not a decorator: a decorator that ignored the story's own output
 * would leave Storybook rendering its "No Preview" placeholder alongside the app.
 *
 * Expects to be remounted on every control change — `App.stories.tsx` forces that with a keyed
 * `<Show>`. That is why the config override and the cache clear are synchronous here: they have to
 * land before RootLayout's first fetch. Driving it in place instead does not work, because
 * `revalidate()` on the config query does not make the live `createAsync` re-request.
 */
export const FullApp = (props: FullAppProps): JSX.Element => {
  // untrack because reading once is the whole design: the keyed <Show> remounts this on every
  // control change, so there is nothing here to react to.
  const path = untrack(() => props.path) ?? '/';
  const features = untrack(() => props.features);
  const offline = untrack(() => props.offline);

  setClientConfigOverrides(features);
  // The previous instance's cached config would otherwise be served to this one.
  query.clear();

  const history = createMemoryHistory();
  history.set({ value: path, replace: true });

  // Deferred a microtask past this component's own onMount: AppProvider (and the connectivity
  // store's `offline`/`online` listeners it registers via its own onMount) is a JSX child
  // rendered below, so its onMount runs after this one — dispatching synchronously here would
  // fire before the listener exists.
  onMount(() => {
    if (!offline) return;
    queueMicrotask(() => window.dispatchEvent(new Event('offline')));
  });

  return (
    <MetaProvider>
      <DedupedMetaProvider>
        <div class={generalTheme}>
          <AppProvider>
            <MemoryRouter history={history}>{appRoutes}</MemoryRouter>
          </AppProvider>
        </div>
      </DedupedMetaProvider>
    </MetaProvider>
  );
};
