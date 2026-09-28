import type { Component, JSX } from 'solid-js';
import { ErrorBoundary, Show, Suspense } from 'solid-js';

import type { ApiResult } from '../../../common/libs/api';
import { useI18n } from '../../../common/libs/i18n';
import { ErrorState } from '../ErrorState/ErrorState';
import { errorKindOf, kindForStatus } from '../ErrorState/kinds';

const Pending: Component = () => {
  const { t } = useI18n();
  return <p aria-busy="true">{t().common.loading}</p>;
};

export interface DataBoundaryProps<T> {
  /** Outcome from a `createSafeApiCall`. `undefined` while it loads. */
  result: ApiResult<T> | undefined;
  children: (data: T) => JSX.Element;
  /** Shown while the data loads. Defaults to a plain loading line. */
  pending?: JSX.Element;
  /** Leave the SSR response status alone — for a failed region inside a page that is otherwise fine. */
  keepStatus?: boolean;
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
export const DataBoundary = <T,>(props: DataBoundaryProps<T>): JSX.Element => (
  <ErrorBoundary fallback={(error) => <ErrorState kind={errorKindOf(error)} keepStatus={props.keepStatus} />}>
    <Suspense fallback={props.pending ?? <Pending />}>
      <Show when={props.result} fallback={props.pending ?? <Pending />}>
        {(result) => (
          <Show
            when={result().ok}
            fallback={
              <ErrorState
                kind={kindForStatus(result().ok ? null : (result() as { status: number | null }).status)}
                keepStatus={props.keepStatus}
              />
            }
          >
            {props.children((result() as { data: T }).data)}
          </Show>
        )}
      </Show>
    </Suspense>
  </ErrorBoundary>
);
