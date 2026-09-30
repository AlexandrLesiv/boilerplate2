export const appBaseUrl = import.meta.env.VITE_APP_BASE_URL;
export const apiBaseUrl = import.meta.env.VITE_APP_API_URL;

/** `path` must start with `/`. Canonical and hreflang links must be fully-qualified — a relative
 * value is flagged as invalid by search engines (hreflang) or ambiguous (canonical). */
export const absoluteUrl = (path: string): string => `${appBaseUrl}${path}`;
