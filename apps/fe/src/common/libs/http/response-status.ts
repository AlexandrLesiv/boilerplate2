import { getRequestEvent, isServer } from 'solid-js/web';

/**
 * Sets the SSR response status during render. A no-op in the browser.
 *
 * Deliberately not `setResponseStatus` from `@solidjs/start/http`: that module pulls h3 into the
 * client bundle, so using it means a dynamic import in every caller. It also only works because
 * `src/middleware.ts` initialises `res.status` first.
 */
export const markResponseStatus = (status: number): void => {
  if (!isServer) return;
  const res = getRequestEvent()?.nativeEvent.res;
  if (res && res.status !== undefined) res.status = status;
};
