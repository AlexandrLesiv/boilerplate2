import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';

import type { InteractiveVariant } from '@/assets/styles/interactiveVariants.css';

import * as styles from './styles.css';

interface AppButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  /** @default 'primary' */
  variant?: InteractiveVariant;
}

export const AppButton: Component<AppButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'class', 'children']);
  const variant = () => local.variant ?? 'primary';

  return (
    <button
      class={[styles.buttonBase, styles.buttonVariants[variant()], local.class].filter(Boolean).join(' ')}
      {...rest}
    >
      {local.children}
    </button>
  );
};
