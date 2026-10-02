import { ApiError } from '@/common/libs/fetch';
import type { Translations } from '@/common/libs/i18n';
import { ChunkLoadError } from '@/common/libs/router';

type ErrorCopy = Translations['pages']['errors'];

/**
 * The kinds are derived from the translation file, and `satisfies` ties the list to it — adding a
 * kind without copy, or copy without a kind, is a type error.
 */
export const ERROR_KINDS = [
  '400',
  '401',
  '403',
  '404',
  '408',
  '429',
  '500',
  '501',
  '502',
  '503',
  '504',
  'offline',
  'unknown',
] as const satisfies readonly Exclude<keyof ErrorCopy, 'backHome' | 'support'>[];

export type ErrorKind = (typeof ERROR_KINDS)[number];

const isKnownKind = (value: string): value is ErrorKind => (ERROR_KINDS as readonly string[]).includes(value);

/** HTTP status to render for a kind, used for the SSR response status. */
export const statusForKind = (kind: ErrorKind): number =>
  isKnownKind(kind) && /^\d+$/.test(kind) ? Number(kind) : 500;

/**
 * A failed `fetch` rejects with a TypeError (`Failed to fetch` in the browser, `fetch failed`
 * under SSR), which is the only signal we get that the server was unreachable rather than
 * unhappy. Under SSR that TypeError means *our own server* couldn't reach the API — a backend
 * availability problem, not a signal about the end user's device — so it maps to `503`, not
 * `offline`.
 *
 * `offline` must be resolved by the caller *at the moment the fetch failed* (from
 * `navigator.onLine`, the same signal `OfflineStatus` uses), not here. This function runs during
 * both the SSR render and the client hydration render of the *same* failed result, and
 * `import.meta.env.SSR`/`navigator.onLine` differ between those two passes — computing them here
 * made SSR paint `503` and hydration silently recompute `unknown` for identical data, which Solid
 * never reconciles (hydration adopts the SSR markup as-is), leaving the page stuck on whichever
 * kind SSR happened to render. `offline: undefined` means "resolved server-side, no such concept
 * as the end user's connectivity" — always `503`. `true`/`false` means "resolved client-side,
 * this is what `navigator.onLine` said at that moment" — a failed fetch while online is something
 * we can't identify (CORS, DNS, a blocking extension), so it's `unknown` rather than a confident
 * but likely-wrong claim that the user is offline.
 */
const noResponseKind = (offline: boolean | undefined): ErrorKind => {
  if (offline === undefined) return '503';
  return offline ? 'offline' : 'unknown';
};

/** `null` means the request never got a response — see `noResponseKind` for what `offline` must be. */
export const kindForStatus = (status: number | null, offline?: boolean): ErrorKind => {
  if (status === null) return noResponseKind(offline);
  const kind = String(status);
  if (isKnownKind(kind)) return kind;
  return status >= 500 ? '500' : 'unknown';
};

export const errorKindOf = (error: unknown, offline?: boolean): ErrorKind => {
  if (error instanceof ApiError) return kindForStatus(error.status, offline);
  // `ChunkLoadError` wraps a route's own failed `import()` — see its doc comment in
  // `common/libs/router` for why that can't be a plain `TypeError` check instead. Same "no
  // response" category as a failed `fetch`: both mean nothing came back, not that something came
  // back unhappy.
  if (error instanceof TypeError || error instanceof ChunkLoadError) return noResponseKind(offline);
  return 'unknown';
};

const RETRYABLE_KINDS: ReadonlySet<ErrorKind> = new Set([
  '408',
  '429',
  '500',
  '502',
  '503',
  '504',
  'offline',
  'unknown',
]);

/** Excludes kinds where re-sending the same request can't change the outcome (bad input, auth, missing resource). */
export const isRetryableKind = (kind: ErrorKind): boolean => RETRYABLE_KINDS.has(kind);
