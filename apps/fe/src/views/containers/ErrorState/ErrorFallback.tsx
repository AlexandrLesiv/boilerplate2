import type { Component } from 'solid-js';

import { useI18n } from '@/common/libs/i18n';
import { useLogger } from '@/common/libs/logger';
import { AppButton } from '@/views/components/Button/AppButton';

import { ErrorState } from './ErrorState';
import { isRetryableKind, type ErrorKind } from './kinds';

export interface ErrorFallbackProps {
  kind: ErrorKind;
  /** Leave the SSR response status alone — for a failed region inside a page that is otherwise fine. */
  keepStatus?: boolean;
  /** Shown as a "Try again" action only for kinds where it could plausibly succeed — see `isRetryableKind`. */
  onRetry?: () => void;
}

/**
 * `<ErrorState>` plus the "Try again" button, gated by `isRetryableKind` — the one piece shared by
 * every place in the app that turns a failure into a page: `DataBoundary` (both its data-shaped
 * failure and its own safety-net `ErrorBoundary`) and `RouteErrorBoundary` (a route itself failing
 * to load). Resolving *which* `kind` applies is each caller's own job — a data failure already has
 * a status code, a thrown error needs `errorKindOf` — so this only takes the resolved `kind`.
 */
export const ErrorFallback: Component<ErrorFallbackProps> = (props) => {
  const { t } = useI18n();
  const logger = useLogger();

  return (
    <ErrorState
      kind={props.kind}
      keepStatus={props.keepStatus}
      actions={
        props.onRetry && isRetryableKind(props.kind) ? (
          <AppButton
            variant="secondary"
            onClick={() => {
              logger.event('error-fallback.retry', { kind: props.kind });
              props.onRetry?.();
            }}
          >
            {t().pages.errors.retry}
          </AppButton>
        ) : undefined
      }
    />
  );
};
