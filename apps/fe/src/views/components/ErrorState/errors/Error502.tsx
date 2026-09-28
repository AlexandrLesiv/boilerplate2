import type { Component } from 'solid-js';

import { useI18n } from '../../../../common/libs/i18n';
import { ErrorLayout } from '../ErrorLayout';
import type { ErrorPageProps } from './types';

export const Error502: Component<ErrorPageProps> = (props) => {
  const { t } = useI18n();
  const copy = () => t().pages.errors['502'];

  return <ErrorLayout status={502} title={copy().title} description={copy().description} actions={props.actions} />;
};
