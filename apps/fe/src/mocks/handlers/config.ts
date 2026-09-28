import { clientConfigRoute, type ClientConfig } from '@repo/shared';
import { http, HttpResponse } from 'msw';

const url = `*${clientConfigRoute.url}`;

const features: ClientConfig['features'] = {
  localeSwitcher: true,
};

export const clientConfig = (overrides: Partial<ClientConfig['features']> = {}) =>
  http.get(url, () => HttpResponse.json({ data: { features: { ...features, ...overrides } } }));

export const clientConfigServerError = http.get(url, () =>
  HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
);

export const clientConfigNetworkError = http.get(url, () => HttpResponse.error());

/** Never resolves — the app should render on the baked defaults meanwhile. */
export const clientConfigSlow = http.get(url, () => new Promise<never>(() => {}));

export const configHandlers = [clientConfig()];
