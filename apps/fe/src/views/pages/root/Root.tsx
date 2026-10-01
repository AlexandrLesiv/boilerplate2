import type { Component } from 'solid-js';
import { Show } from 'solid-js';

import { format, useI18n } from '@/common/libs/i18n';
import { useRootStore } from '@/common/libs/stores/root';
import { Heading } from '@/views/components/Heading/Heading';
import { Text } from '@/views/components/Text/Text';

const Root: Component = () => {
  const { state } = useRootStore();
  const { t } = useI18n();

  return (
    <div>
      <Heading as="h1">{t().pages.home.title}</Heading>
      <Show when={state.user} fallback={<Text>{t().pages.home.welcomeAnon}</Text>}>
        {(user) => <Text>{format(t().pages.home.welcomeUser, { email: user().email })}</Text>}
      </Show>
    </div>
  );
};

export default Root;
