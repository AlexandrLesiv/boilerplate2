import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';

import { A } from '@solidjs/router';

import { absoluteUrl } from '@/common/constants/environment';
import { useI18n } from '@/common/libs/i18n';
import type { JsonLdSchema } from '@/common/libs/seo/JsonLd';
import { defineJsonLd } from '@/common/libs/seo/JsonLd';

import * as styles from './styles.css';

export interface BreadcrumbItem {
  label: string;
  /** App-relative path (e.g. `/news`) — unused for the last item, which renders as the current
   * page and is never a link. See Breadcrumbs/AGENTS.md. */
  href: string;
}

export interface BreadcrumbsProps {
  /** Ordered from the site root to the current page, inclusive. */
  items: BreadcrumbItem[];
  class?: string;
}

// Built from the exact same items the visible trail renders, so the two can never drift apart —
// call this with the same array passed to `<Breadcrumbs items>`. See Breadcrumbs/AGENTS.md.
export const defineBreadcrumbListSchema = (items: BreadcrumbItem[]): JsonLdSchema =>
  defineJsonLd({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  });

// A plain `<A>`, no extra class — the global bare-`<a>` rule (`global.css.ts`) already gives it
// the contrast-verified `linkText` color and hover underline (see Link/AGENTS.md); `styles.list`
// only sets the smaller size/muted color the *current*-page `<span>` needs, which `<A>` doesn't
// inherit around since `global.css.ts` sets its own `color` directly on `a` — see Breadcrumbs/AGENTS.md.
export const Breadcrumbs: Component<BreadcrumbsProps> = (props) => {
  const { t } = useI18n();
  const lastIndex = () => props.items.length - 1;

  return (
    <Show when={props.items.length > 0}>
      <nav aria-label={t().common.breadcrumbs.label} class={props.class}>
        <ol class={styles.list}>
          <For each={props.items}>
            {(item, index) => (
              <li class={styles.item}>
                <Show when={index() < lastIndex()} fallback={<span aria-current="page">{item.label}</span>}>
                  <A href={item.href}>{item.label}</A>
                  <span aria-hidden="true">/</span>
                </Show>
              </li>
            )}
          </For>
        </ol>
      </nav>
    </Show>
  );
};
