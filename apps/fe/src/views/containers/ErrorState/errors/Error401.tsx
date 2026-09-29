import type { Component } from 'solid-js';

import { useI18n } from '@/common/libs/i18n';

import { ErrorLayout } from '../ErrorLayout';
import type { ErrorPageProps } from './types';

export const Error401: Component<ErrorPageProps> = (props) => {
  const { t } = useI18n();
  const copy = () => t().pages.errors['401'];

  return <ErrorLayout status={401} title={copy().title} description={copy().description} actions={props.actions} />;
};
