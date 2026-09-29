import type { JSX } from 'solid-js';

export interface ErrorPageProps {
  /** Status-specific actions, rendered above the shared support prompt. */
  actions?: JSX.Element;
}
