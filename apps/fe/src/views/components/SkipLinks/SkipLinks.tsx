import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { useI18n } from '@/common/libs/i18n';
import type { Translations } from '@/common/libs/i18n';

import { SkipLink } from './SkipLink';
import * as styles from './styles.css';

type SkipLinkTarget = { targetId: string; label: (t: Translations) => string };

// One entry today — `main-content` is the only landmark in RootLayout worth jumping to besides
// the header itself. Add a target here the day a second one earns its place (e.g. a search
// field or a footer); SkipLinks renders however many are listed.
const TARGETS: SkipLinkTarget[] = [{ targetId: 'main-content', label: (t) => t.common.skipLink }];

export const SkipLinks: Component = () => {
  const { t } = useI18n();

  return (
    <nav class={styles.container} aria-label={t().common.skipLinksLabel}>
      <For each={TARGETS}>{(target) => <SkipLink targetId={target.targetId} label={target.label(t())} />}</For>
    </nav>
  );
};
