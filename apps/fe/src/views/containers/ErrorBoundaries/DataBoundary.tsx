import type { Component, JSX } from 'solid-js';
import { createMemo, ErrorBoundary, Match, Suspense, Switch } from 'solid-js';

import type { ApiResult } from '@/common/libs/api';
import type { RenderProp } from '@/common/types';
import { TimedLoader } from '@/views/components/TimedLoader/TimedLoader';

import { ErrorFallback } from '../ErrorState/ErrorFallback';
import { errorKindOf, kindForStatus } from '../ErrorState/kinds';

const Pending: Component = () => <TimedLoader />;

export interface DataBoundaryProps<T> {
  /** Outcome from a `createSafeApiCall`. `undefined` while it loads. */
  result: ApiResult<T> | undefined;
  /** Receives an accessor — read it inside the returned JSX. See `RenderProp`. */
  children: RenderProp<T>;
  /** Shown while the data loads. Defaults to a plain loading line. */
  pending?: JSX.Element;
  /** Leave the SSR response status alone — for a failed region inside a page that is otherwise fine. */
  keepStatus?: boolean;
  /**
   * Re-runs the failed read, e.g. `() => revalidate(getArticle.key)`. Shown as a "Try again" action
   * only for kinds where re-sending the same request could plausibly succeed — see `isRetryableKind`.
   */
  onRetry?: () => void;
}

/**
 * Owns all three states of a data read: loading, failed, loaded.
 *
 * A failure arrives as data (`{ ok: false, status }`) rather than as a rejection, which is what
 * keeps it out of the browser console — see `createSafeApiCall`. The `ErrorBoundary` is still here
 * for genuinely unexpected throws, such as a bug in the children.
 *
 * Because the error page renders only once a definitive result exists, it is also safe for it to
 * set the SSR response status: SSR discards a first render pass while the resource is pending, and
 * anything rendered in that pass would otherwise leak its status into a successful response.
 */
export const DataBoundary = <T,>(props: DataBoundaryProps<T>): JSX.Element => {
  const failure = () => (props.result && !props.result.ok ? props.result : undefined);
  const data = () => (props.result?.ok ? props.result.data : undefined);

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorFallback
          kind={errorKindOf(error)}
          keepStatus={props.keepStatus}
          onRetry={
            props.onRetry &&
            (() => {
              props.onRetry?.();
              reset();
            })
          }
        />
      )}
    >
      <Suspense fallback={props.pending ?? <Pending />}>
        <Switch fallback={props.pending ?? <Pending />}>
          <Match when={failure()}>
            {(f) => {
              const kind = createMemo(() => kindForStatus(f().status, f().offline));
              return <ErrorFallback kind={kind()} keepStatus={props.keepStatus} onRetry={props.onRetry} />;
            }}
          </Match>
          <Match when={props.result?.ok}>{props.children(() => data() as T)}</Match>
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
};
