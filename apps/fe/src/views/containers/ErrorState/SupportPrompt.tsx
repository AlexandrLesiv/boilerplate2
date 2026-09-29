import type { Component } from 'solid-js';

import { useI18n } from '@/common/libs/i18n';
import { useLogger } from '@/common/libs/logger';
import { AppButton } from '@/views/components/Button/AppButton';

import * as styles from './styles.css';

/**
 * Shared across every error page. Sending is not wired up yet — the click is recorded so the
 * intent is visible in the session log, and `logger.export()` is what it should eventually call.
 */
export const SupportPrompt: Component = () => {
  const { t } = useI18n();
  const logger = useLogger();

  const handleSend = () => {
    logger.event('support.logs.send');
  };

  return (
    <div class={styles.supportPrompt}>
      <p class={styles.supportText}>{t().pages.errors.support.prompt}</p>
      <AppButton variant="secondary" onClick={handleSend}>
        {t().pages.errors.support.sendLogs}
      </AppButton>
    </div>
  );
};
