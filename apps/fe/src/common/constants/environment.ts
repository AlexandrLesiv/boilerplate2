export const appBaseUrl = import.meta.env.VITE_APP_BASE_URL;
// In dev, the *browser* talks to the Vite dev server's own origin and relies on its `/api` proxy
// (vite.config.ts) to reach the real API, rather than a second absolute URL baked into the client
// bundle — that's what makes the API reachable from a phone on the LAN without `localhost`
// resolving to the phone itself. SSR always talks to the API directly (no browser or proxy
// involved in the Node process rendering the page), and production client builds always use the
// real configured origin — neither of those goes through the dev-only proxy.
export const apiBaseUrl = import.meta.env.DEV && !import.meta.env.SSR ? '/api' : import.meta.env.VITE_APP_API_URL;

/** `path` must start with `/`. Canonical and hreflang links must be fully-qualified — a relative
 * value is flagged as invalid by search engines (hreflang) or ambiguous (canonical). */
export const absoluteUrl = (path: string): string => `${appBaseUrl}${path}`;
