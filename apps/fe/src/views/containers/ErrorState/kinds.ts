import { ApiError } from '@/common/libs/fetch';
import type { Translations } from '@/common/libs/i18n';

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
 * A failed `fetch` rejects with a TypeError (`Failed to fetch` in the browser, `fetch failed` under
 * SSR), which is the only signal we get that the server was unreachable rather than unhappy.
 */
/** `null` means the request never got a response. */
export const kindForStatus = (status: number | null): ErrorKind => {
  if (status === null) return 'offline';
  const kind = String(status);
  if (isKnownKind(kind)) return kind;
  return status >= 500 ? '500' : 'unknown';
};

export const errorKindOf = (error: unknown): ErrorKind => {
  if (error instanceof ApiError) return kindForStatus(error.status);
  if (error instanceof TypeError) return 'offline';
  return 'unknown';
};
