import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';

import { useNavigate } from '@solidjs/router';
import { loginRoute } from '@repo/shared';

import { createApiCall } from '../../../common/libs/api';
import { useI18n } from '../../../common/libs/i18n';
import { useLogger } from '../../../common/libs/logger';
import { useRootStore } from '../../../common/libs/stores/root';
import { AppButton } from '../../components/Button/AppButton';
import { container, title, form, fieldGroup, input, errorText } from './styles.css';

const LoginPage: Component = () => {
  const navigate = useNavigate();
  const { setUser, setLoading, state } = useRootStore();
  const { t } = useI18n();
  const login = createApiCall(loginRoute);
  const logger = useLogger();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    logger.event('login.submit', { hasEmail: !!email(), hasPassword: !!password() });
    try {
      const { data: user } = await login({ body: { email: email(), password: password() } });
      setUser(user);
      logger.event('login.success');
      logger.navigation('/');
      void navigate('/');
    } catch (err) {
      logger.error('login.failed', { reason: String(err) });
      setError(t().pages.login.errorInvalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class={container}>
      <h1 class={title}>{t().pages.login.title}</h1>
      <form onSubmit={handleSubmit} class={form}>
        <div class={fieldGroup}>
          <label for="email">{t().pages.login.emailLabel}</label>
          <input
            id="email"
            type="email"
            autocomplete="email"
            value={email()}
            onInput={(e) => setEmail(e.target.value)}
            required
            class={input}
          />
        </div>
        <div class={fieldGroup}>
          <label for="password">{t().pages.login.passwordLabel}</label>
          <input
            id="password"
            type="password"
            autocomplete="current-password"
            value={password()}
            onInput={(e) => setPassword(e.target.value)}
            required
            class={input}
          />
        </div>
        <Show when={error()}>{(msg) => <p role="alert" class={errorText}>{msg()}</p>}</Show>
        <AppButton type="submit" disabled={state.isLoading}>
          {state.isLoading ? t().pages.login.submittingBtn : t().pages.login.submitBtn}
        </AppButton>
      </form>
    </div>
  );
};

export default LoginPage;
