import type { Component } from 'solid-js';

import { useI18n } from '../../../../common/libs/i18n';
import { ErrorLayout } from '../ErrorLayout';
import type { ErrorPageProps } from './types';

/** No status code shown — there was no HTTP response to report. */
export const ErrorOffline: Component<ErrorPageProps> = (props) => {
  const { t } = useI18n();
  const copy = () => t().pages.errors['offline'];

  return <ErrorLayout title={copy().title} description={copy().description} actions={props.actions} />;
};
