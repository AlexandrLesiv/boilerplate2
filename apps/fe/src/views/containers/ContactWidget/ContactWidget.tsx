import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';

import { useI18n } from '@/common/libs/i18n';
import { AppButton } from '@/views/components/Button/AppButton';
import { Dialog } from '@/views/components/Dialog/Dialog';

import { ContactChat } from './ContactChat';
import * as styles from './styles.css';

/**
 * The app's one "ask a question" entry point — a floating action button, rendered once by
 * `RootLayout` so it's visible on every page, that opens `ContactChat` inside a `Dialog`.
 * Self-contained (owns its own open/close signal) for the same reason `LoginDialog` is: this is
 * one cohesive feature, not app state `RootLayout` needs to own. See ContactWidget/AGENTS.md.
 */
export const ContactWidget: Component = () => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);
  let triggerRef: HTMLButtonElement | undefined;

  return (
    <>
      <AppButton variant="primary" class={styles.trigger} ref={(el) => (triggerRef = el)} onClick={() => setOpen(true)}>
        <svg
          aria-hidden="true"
          class={styles.triggerIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {t().common.contact.triggerLabel}
      </AppButton>
      {/* `getAnchorElement`, not omitted — the dialog grows from this button instead of the
      screen center, same mechanism `LoginDialog` uses. See Dialog/AGENTS.md ("Anchoring the
      open/close pivot to a trigger element"). */}
      <Dialog
        open={open()}
        onClose={() => setOpen(false)}
        title={t().common.contact.dialogTitle}
        getAnchorElement={() => triggerRef}
      >
        {() => <ContactChat />}
      </Dialog>
    </>
  );
};
