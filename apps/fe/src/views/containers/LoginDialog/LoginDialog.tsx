import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';

import { useI18n } from '@/common/libs/i18n';
import { useLogger } from '@/common/libs/logger';
import { useRootStore } from '@/common/libs/stores/root';
import { AppButton } from '@/views/components/Button/AppButton';
import { Dialog } from '@/views/components/Dialog/Dialog';
import { LoginForm } from '@/views/pages/login/LoginForm';

import * as styles from './styles.css';

/**
 * The header's one authentication entry point: a "Login" trigger that opens `LoginForm` inside a
 * `Dialog`, or — once signed in — the account status in its place. Self-contained (owns its own
 * open/close signal) so `RootLayout` just renders it, rather than owning a signal for a feature
 * that's entirely its own concern.
 */
export const LoginDialog: Component = () => {
  const { state, logout } = useRootStore();
  const { t } = useI18n();
  const logger = useLogger();
  const [open, setOpen] = createSignal(false);
  // Plain mutable ref, not a signal — the button is never re-created while mounted, so there's
  // nothing reactive to track; `Dialog` only reads this once per open/close via the accessor.
  let triggerRef: HTMLButtonElement | undefined;

  return (
    <Show
      when={state.user}
      fallback={
        <>
          <AppButton
            variant="ghost"
            class={styles.authTrigger}
            ref={(el) => (triggerRef = el)}
            onClick={() => setOpen(true)}
          >
            {t().nav.login}
          </AppButton>
          <Dialog
            open={open()}
            onClose={() => setOpen(false)}
            title={t().pages.login.title}
            getAnchorElement={() => triggerRef}
          >
            {() => <LoginForm onSuccess={() => setOpen(false)} />}
          </Dialog>
        </>
      }
    >
      {(user) => (
        <div class={styles.account}>
          <span>{user().email}</span>
          <AppButton
            variant="ghost"
            class={styles.authTrigger}
            onClick={() => {
              logger.event('logout.submit');
              logout();
            }}
          >
            {t().nav.logout}
          </AppButton>
        </div>
      )}
    </Show>
  );
};
