import type { Component } from 'solid-js';
import { untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { markResponseStatus } from '../../../common/libs/http/response-status';
import { ERROR_PAGES, type ErrorPageProps } from './errors';
import { statusForKind, type ErrorKind } from './kinds';

export interface ErrorStateProps extends ErrorPageProps {
  kind: ErrorKind;
  /** Leave the SSR response status alone — for a failed region inside a page that is otherwise fine. */
  keepStatus?: boolean;
}

/** Picks the page for a kind and owns the SSR response status; the pages themselves are pure. */
export const ErrorState: Component<ErrorStateProps> = (props) => {
  // untrack: this only does anything during SSR, which renders once. A later `kind` change still
  // swaps the page below, because that read happens inside JSX.
  untrack(() => {
    if (!props.keepStatus) markResponseStatus(statusForKind(props.kind));
  });

  return <Dynamic component={ERROR_PAGES[props.kind]} actions={props.actions} />;
};
