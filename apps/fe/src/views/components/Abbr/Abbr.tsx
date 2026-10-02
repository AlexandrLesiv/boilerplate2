import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';

import * as styles from './styles.css';

export interface AbbrProps extends JSX.HTMLAttributes<HTMLElement> {
  /** The expansion — exposed via the native `title` attribute (WCAG technique H28, 3.1.4
   * Abbreviations). Required: an `<abbr>` with no `title` reads as plain text to assistive tech. */
  title: string;
  class?: string;
}

export const Abbr: Component<AbbrProps> = (props) => {
  const [local, rest] = splitProps(props, ['title', 'class', 'children']);

  return (
    <abbr title={local.title} class={[styles.base, local.class].filter(Boolean).join(' ')} {...rest}>
      {local.children}
    </abbr>
  );
};
