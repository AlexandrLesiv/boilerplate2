import type { Component } from 'solid-js';
import { Show } from 'solid-js';

import { format, useI18n } from '../../../common/libs/i18n';
import { useRootStore } from '../../../common/libs/stores/root';

const Root: Component = () => {
  const { state } = useRootStore();
  const { t } = useI18n();

  return (
    <div>
      <h1>{t().pages.home.title}</h1>
      <Show when={state.user} fallback={<p>{t().pages.home.welcomeAnon}</p>}>
        {(user) => <p>{format(t().pages.home.welcomeUser, { email: user().email })}</p>}
      </Show>
    </div>
  );
};

export default Root;
