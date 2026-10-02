import type { Component, JSX } from 'solid-js';
import { Show, splitProps } from 'solid-js';

import type { InteractiveVariant } from '@/assets/styles/interactiveVariants.css';

import * as styles from './styles.css';

interface AppButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  /** @default 'primary' */
  variant?: InteractiveVariant;
  /**
   * For an action whose result isn't instant (a submit awaiting a reply, a mutation in flight)
   * — shows a spinner alongside the button's own label, sets `disabled` (combined with an
   * explicit `disabled`, not replacing it, so the button stays disabled for that other reason
   * once loading finishes) and `aria-busy`.
   */
  loading?: boolean;
}

export const AppButton: Component<AppButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'class', 'children', 'loading', 'disabled']);
  const variant = () => local.variant ?? 'primary';

  return (
    <button
      class={[styles.buttonBase, styles.buttonVariants[variant()], local.class].filter(Boolean).join(' ')}
      disabled={local.loading || local.disabled}
      aria-busy={local.loading ? 'true' : undefined}
      {...rest}
    >
      <Show when={local.loading}>
        <span aria-hidden="true" class={styles.spinner} />
      </Show>
      {local.children}
    </button>
  );
};
