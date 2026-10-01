import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import * as styles from './styles.css';

export type TextTag = 'p' | 'span';
export type TextVariant = 'primary' | 'secondary';
export type TextSize = 'normal' | 'small';

export interface TextProps extends JSX.HTMLAttributes<HTMLElement> {
  /** @default 'p' */
  as?: TextTag;
  /** @default 'primary' */
  variant?: TextVariant;
  /** @default 'normal' */
  size?: TextSize;
  /**
   * Keeps digit widths uniform (`font-variant-numeric: tabular-nums`) so numeric text doesn't
   * visibly shift width as its own digits change — scores, counts, anything re-rendered with a
   * different number of proportionally-narrow digits (`1` vs `0`, in most fonts). Opt-in, not a
   * default: most `Text` content isn't numeric, and some fonts change *which glyphs* render for
   * tabular digits, not just their width — verify before unconditionally relying on it with
   * whatever font this app actually ends up loading. See Text/AGENTS.md.
   * @default false
   */
  numeric?: boolean;
  class?: string;
}

// No margin here, in either direction — `as="span"` must never carry block-spacing that implies
// a paragraph break it isn't; `as="p"` relies on its container's own `gap`/layout instead of a
// margin convention, same as `Dialog`'s `fieldGroup` and `form` already do. See Text/AGENTS.md.
export const Text: Component<TextProps> = (props) => {
  const [local, rest] = splitProps(props, ['as', 'variant', 'size', 'numeric', 'class', 'children']);
  const variant = () => local.variant ?? 'primary';
  const size = () => local.size ?? 'normal';

  return (
    <Dynamic
      component={local.as ?? 'p'}
      class={[
        styles.base,
        styles.variants[variant()],
        styles.sizes[size()],
        local.numeric && styles.numeric,
        local.class,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
};
