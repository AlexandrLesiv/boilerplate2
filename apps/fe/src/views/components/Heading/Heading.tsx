import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import * as styles from './styles.css';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type HeadingSize = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

// Defaults only — `size` below always wins when passed. Visual size and document-outline level
// are deliberately independent: a page can need an `<h2>` that doesn't look like "the second
// biggest text on the page", and forcing size to follow `as` would make that impossible without
// picking the wrong heading level just to get the right look. See Heading/AGENTS.md.
const DEFAULT_SIZE_BY_LEVEL: Record<HeadingLevel, HeadingSize> = {
  h1: 'xl',
  h2: 'lg',
  h3: 'md',
  h4: 'sm',
  h5: 'sm',
  h6: 'xs',
};

export interface HeadingProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level — required, never inferred from `size`. Decides the real `<h1>`–`<h6>` tag. */
  as: HeadingLevel;
  /** Visual size. Defaults from `as` (see `DEFAULT_SIZE_BY_LEVEL`) when omitted. */
  size?: HeadingSize;
  class?: string;
}

export const Heading: Component<HeadingProps> = (props) => {
  const [local, rest] = splitProps(props, ['as', 'size', 'class', 'children']);
  const size = () => local.size ?? DEFAULT_SIZE_BY_LEVEL[local.as];

  return (
    <Dynamic
      component={local.as}
      class={[styles.base, styles.sizes[size()], local.class].filter(Boolean).join(' ')}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
};
