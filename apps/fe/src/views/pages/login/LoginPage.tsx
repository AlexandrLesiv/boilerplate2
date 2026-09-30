import type { Component } from 'solid-js';

import { useNavigate } from '@solidjs/router';

import { useI18n } from '@/common/libs/i18n';
import { useLogger } from '@/common/libs/logger';

import { LoginForm } from './LoginForm';
import * as styles from './styles.css';

const LoginPage: Component = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const logger = useLogger();

  const handleSuccess = () => {
    logger.navigation('/');
    navigate('/');
  };

  return (
    <div class={styles.container}>
      <h1 class={styles.title}>{t().pages.login.title}</h1>
      <LoginForm onSuccess={handleSuccess} />
    </div>
  );
};

export default LoginPage;
