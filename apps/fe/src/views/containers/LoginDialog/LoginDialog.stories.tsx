import { For } from 'solid-js';

import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { AppButton } from '@/views/components/Button/AppButton';

import { withAppProviders } from '../../../../.storybook/decorators';
import * as styles from './styles.css';

const LABELS = ['Login', 'Увійти', 'Войти', 'Log out', 'Вийти', 'Выйти'];

const meta: Meta = {
  title: 'Containers/LoginDialog',
  decorators: [withAppProviders()],
};

export default meta;
type Story = StoryObj;

/** Every login/logout label this button shows, across all three locales, must render at the
 * same width — measured 46.1px ("Log out") to 63.6px ("Увійти") before `authTrigger`'s
 * `min-width` (`LoginDialog/styles.css.ts`). Without it, switching locale — or logging in/out,
 * which swaps this same button between these two labels — changes the button's own width and
 * shifts `headerRight`'s other children, since `header` is `justify-content: space-between`. */
export const LabelWidthsStayFixed: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <For each={LABELS}>
        {(label) => (
          <AppButton variant="ghost" class={styles.authTrigger} data-testid={label}>
            {label}
          </AppButton>
        )}
      </For>
    </div>
  ),
  play: async ({ canvas }) => {
    const widths = await Promise.all(
      LABELS.map(async (label) => (await canvas.findByTestId(label)).getBoundingClientRect().width)
    );
    for (const width of widths) await expect(width).toBe(widths[0]);
  },
};
