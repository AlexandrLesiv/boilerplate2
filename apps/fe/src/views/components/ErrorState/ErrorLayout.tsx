import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';

import { A, useParams } from '@solidjs/router';

import { localeFromParams, localePath, useI18n } from '../../../common/libs/i18n';
import { actionRow, container, description, statusCode, title } from './styles.css';
import { SupportPrompt } from './SupportPrompt';

export interface ErrorLayoutProps {
  /** Rendered large above the title. Omit when there was no HTTP response. */
  status?: number;
  title: string;
  description: string;
  /** Status-specific actions, rendered next to the home link. */
  actions?: JSX.Element;
}

/**
 * Chrome shared by every error page. Presentation only — setting the SSR response status is
 * `ErrorState`'s job, so this is safe to drop into a region inside an otherwise healthy page.
 *
 * Sized by its container, never the viewport: the root is an inline-size container and the status
 * code scales with `cqi`, so the same component works as a full page and as a small panel.
 */
export const ErrorLayout: Component<ErrorLayoutProps> = (props) => {
  const { t } = useI18n();
  const params = useParams<{ locale?: string }>();

  return (
    <section class={container}>
      <Show when={props.status !== undefined}>
        <p class={statusCode}>{props.status}</p>
      </Show>
      <h1 class={title}>{props.title}</h1>
      <p class={description}>{props.description}</p>
      <div class={actionRow}>
        <A href={localePath('/', localeFromParams(params))}>{t().pages.errors.backHome}</A>
        {props.actions}
      </div>
      <SupportPrompt />
    </section>
  );
};
