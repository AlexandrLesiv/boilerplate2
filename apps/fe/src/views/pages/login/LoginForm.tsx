import type { Component } from 'solid-js';
import { createSignal, createUniqueId, Show } from 'solid-js';

import { loginRoute } from '@repo/shared';

import { createMutation } from '@/common/libs/api';
import { useI18n } from '@/common/libs/i18n';
import { useLogger } from '@/common/libs/logger';
import { useRootStore } from '@/common/libs/stores/root';
import { AppButton } from '@/views/components/Button/AppButton';

import * as styles from './styles.css';

export interface LoginFormProps {
  /** Called after `setUser` succeeds — navigate away, close a dialog, whatever the caller needs. */
  onSuccess: () => void;
}

/**
 * Shared between the standalone `/login` page and `LoginDialog` — the mutation, error handling and
 * i18n keys are the same either way; only what happens after a successful login differs, which is
 * why that's the one thing left to the caller rather than hardcoded here.
 */
export const LoginForm: Component<LoginFormProps> = (props) => {
  const { setUser, setLoading, state } = useRootStore();
  const { t } = useI18n();
  const login = createMutation(loginRoute);
  const logger = useLogger();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const emailId = createUniqueId();
  const passwordId = createUniqueId();

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    logger.event('login.submit', { hasEmail: !!email(), hasPassword: !!password() });
    try {
      const { data: user } = await login({ body: { email: email(), password: password() } });
      setUser(user);
      logger.event('login.success');
      props.onSuccess();
    } catch (err) {
      logger.error('login.failed', { reason: String(err) });
      setError(t().pages.login.errorInvalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class={styles.form}>
      <div class={styles.fieldGroup}>
        <label for={emailId}>{t().pages.login.emailLabel}</label>
        <input
          id={emailId}
          type="email"
          autocomplete="email"
          value={email()}
          onInput={(e) => setEmail(e.target.value)}
          required
          class={styles.input}
        />
      </div>
      <div class={styles.fieldGroup}>
        <label for={passwordId}>{t().pages.login.passwordLabel}</label>
        <input
          id={passwordId}
          type="password"
          autocomplete="current-password"
          value={password()}
          onInput={(e) => setPassword(e.target.value)}
          required
          class={styles.input}
        />
      </div>
      <Show when={error()}>
        {(msg) => (
          <p role="alert" class={styles.errorText}>
            {msg()}
          </p>
        )}
      </Show>
      <AppButton type="submit" disabled={state.isLoading}>
        {state.isLoading ? t().pages.login.submittingBtn : t().pages.login.submitBtn}
      </AppButton>
    </form>
  );
};
