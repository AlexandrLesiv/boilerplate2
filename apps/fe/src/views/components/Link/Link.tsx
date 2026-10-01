import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';

import type { InteractiveVariant } from '@/assets/styles/interactiveVariants.css';
import { interactiveBase, interactiveVariants } from '@/assets/styles/interactiveVariants.css';

export interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** @default 'link' */
  variant?: InteractiveVariant;
  class?: string;
}

// A plain `<a>`, not `@solidjs/router`'s `<A>` — this is for external links and anywhere a plain
// anchor is the right tag (`ArticlePage`'s outbound HN link, a "Back to news" link that doesn't
// need SPA client-side routing semantics). For an *internal* route that also wants one of these
// variants, apply `interactiveVariants[variant]` directly to `<A>` yourself — the variants are a
// plain exported class map, not locked inside this component. See Link/AGENTS.md.
export const Link: Component<LinkProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'class', 'children']);
  const variant = () => local.variant ?? 'link';

  return (
    <a class={[interactiveBase, interactiveVariants[variant()], local.class].filter(Boolean).join(' ')} {...rest}>
      {local.children}
    </a>
  );
};
