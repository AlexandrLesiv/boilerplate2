import { clientConfigRoute, type ClientConfig } from '@repo/shared';
import { http, HttpResponse } from 'msw';

const url = `*${clientConfigRoute.url}`;

const features: ClientConfig['features'] = {
  localeSwitcher: true,
};

let controlled: Partial<ClientConfig['features']> = {};

/**
 * Lets a Storybook control drive the flags: the default handler reads this at request time, so
 * setting it and revalidating the config query is enough to change what the app sees.
 * `.storybook/preview.tsx` resets it before every story.
 */
export const setClientConfigOverrides = (next: Partial<ClientConfig['features']> = {}) => {
  controlled = next;
};

export const clientConfig = (overrides: Partial<ClientConfig['features']> = {}) =>
  http.get(url, () => HttpResponse.json({ data: { features: { ...features, ...overrides } } }));

const controlledClientConfig = http.get(url, () =>
  HttpResponse.json({ data: { features: { ...features, ...controlled } } })
);

export const clientConfigServerError = http.get(url, () =>
  HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
);

export const clientConfigNetworkError = http.get(url, () => HttpResponse.error());

/** Never resolves — the app should render on the baked defaults meanwhile. */
export const clientConfigSlow = http.get(url, () => new Promise<never>(() => {}));

export const configHandlers = [controlledClientConfig];
