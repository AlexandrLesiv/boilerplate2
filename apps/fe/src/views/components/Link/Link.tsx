import type { Component, JSX } from 'solid-js';
import { Show, splitProps } from 'solid-js';

import type { InteractiveVariant } from '@/assets/styles/interactiveVariants.css';
import { interactiveBase, interactiveVariants } from '@/assets/styles/interactiveVariants.css';
import { visuallyHidden } from '@/assets/styles/visually-hidden.css';
import { useI18n } from '@/common/libs/i18n';

import * as styles from './styles.css';

export interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** @default 'link' */
  variant?: InteractiveVariant;
  /** Renders the external-link icon and an "opens in new tab" cue for screen readers. Explicit,
   * not inferred from `href`/`target` — see Link/AGENTS.md. */
  external?: boolean;
  class?: string;
}

// A plain `<a>`, not `@solidjs/router`'s `<A>` — this is for external links and anywhere a plain
// anchor is the right tag (`ArticlePage`'s outbound HN link, a "Back to news" link that doesn't
// need SPA client-side routing semantics). For an *internal* route that also wants one of these
// variants, apply `interactiveVariants[variant]` directly to `<A>` yourself — the variants are a
// plain exported class map, not locked inside this component. See Link/AGENTS.md.
export const Link: Component<LinkProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'external', 'class', 'children']);
  const { t } = useI18n();
  const variant = () => local.variant ?? 'link';

  return (
    <a class={[interactiveBase, interactiveVariants[variant()], local.class].filter(Boolean).join(' ')} {...rest}>
      {local.children}
      <Show when={local.external}>
        {/* Decorative — the visually-hidden span below carries the meaning for screen readers.
         * Leading nbsp + `nowrap` (styles.css.ts) keeps the icon glued to the preceding word
         * instead of wrapping onto its own line. */}
        <span aria-hidden="true" class={styles.iconWrap}>
          {' '}
          <svg
            class={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </span>
        <span class={visuallyHidden}>{t().common.link.opensInNewTab}</span>
      </Show>
    </a>
  );
};
