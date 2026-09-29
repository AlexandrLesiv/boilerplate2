import type { Component, JSX } from 'solid-js';
import { createSignal, Show, splitProps } from 'solid-js';

import { Link } from '@solidjs/meta';

import { format, useI18n } from '../../../common/libs/i18n';
import { useLogger } from '../../../common/libs/logger';
import * as styles from './styles.css';

export interface ImageProps extends Omit<
  JSX.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'width' | 'height' | 'loading' | 'decoding' | 'fetchpriority' | 'onError' | 'class'
> {
  src: string;
  /** Required — pass `""` only for a genuinely decorative image; the fallback then stays silent for assistive tech too. */
  alt: string;
  width: number;
  height: number;
  /** Above-the-fold / LCP image: eager + sync decode, high fetch priority, and an SSR preload `<link>`. */
  preload?: boolean;
  class?: string;
}

/**
 * `<img>` with mandatory alt/width/height, sane loading defaults, and an obviously-a-placeholder
 * fallback if the load fails for any reason.
 *
 * SSR has no way to know a load will fail — that's a client-only event — so the first paint (and
 * every SSR render) always assumes success; the fallback only ever appears after hydration, when
 * the browser actually fires `error` on the `<img>`.
 */
export const Image: Component<ImageProps> = (props) => {
  const [local, rest] = splitProps(props, ['src', 'alt', 'width', 'height', 'preload', 'class']);
  const [failed, setFailed] = createSignal(false);
  const { t } = useI18n();
  const logger = useLogger();

  const decorative = () => local.alt === '';

  return (
    <div class={[styles.imageContainer, local.class].filter(Boolean).join(' ')}>
      <Show when={local.preload}>
        <Link rel="preload" as="image" href={local.src} fetchpriority="high" />
      </Show>
      <img
        {...rest}
        src={local.src}
        alt={local.alt}
        width={local.width}
        height={local.height}
        loading={local.preload ? 'eager' : 'lazy'}
        decoding={local.preload ? 'sync' : 'async'}
        fetchpriority={local.preload ? 'high' : 'auto'}
        class={styles.imageEl}
        classList={{ [styles.imageElHidden]: failed() }}
        onError={() => {
          if (failed()) return;
          setFailed(true);
          logger.warn('image.load-error', { src: local.src });
        }}
      />
      <Show when={failed()}>
        <div
          class={styles.fallback}
          role={decorative() ? undefined : 'img'}
          aria-hidden={decorative() ? 'true' : undefined}
          aria-label={decorative() ? undefined : format(t().common.image.fallbackAriaLabel, { alt: local.alt })}
        >
          <svg
            class={styles.fallbackIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-5-5L5 21" />
            <line x1="3" y1="3" x2="21" y2="21" />
          </svg>
          <span class={styles.fallbackLabel}>{t().common.image.fallbackLabel}</span>
        </div>
      </Show>
    </div>
  );
};
