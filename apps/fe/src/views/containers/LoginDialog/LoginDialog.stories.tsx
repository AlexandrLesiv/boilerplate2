import { For } from 'solid-js';

import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { responsiveBreakPoints } from '@/assets/styles/responsive/breakpoints';
import { AppButton } from '@/views/components/Button/AppButton';

import { withAppProviders } from '../../../../.storybook/decorators';
import { LoginDialog } from './LoginDialog';
import * as styles from './styles.css';

const LABELS = ['Login', 'Увійти', 'Войти', 'Log out', 'Вийти', 'Выйти'];

const meta: Meta = {
  title: 'Containers/LoginDialog',
  decorators: [withAppProviders()],
};

export default meta;
type Story = StoryObj;

/**
 * Clicking "Login" opens `Dialog` anchored to the trigger button — the card's open/close pivot is
 * the button's own position (`--dialog-origin-x`/`-y`), not the dialog's center, so it visibly
 * grows from where the click happened instead of popping out of empty space. See
 * `Dialog/AGENTS.md` ("Anchoring the open/close pivot to a trigger element"). Below `sm` the
 * anchor is skipped by design (see `Dialog.tsx`), so this asserts whichever of the two documented
 * outcomes actually applies to the browser this runs in, rather than assuming desktop width.
 */
export const OpensAnchoredToTrigger: Story = {
  render: () => <LoginDialog />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Login' }));
    const dialog = await canvas.findByRole('dialog');
    const originX = getComputedStyle(dialog).getPropertyValue('--dialog-origin-x');
    const isMobile = window.innerWidth < Number.parseInt(responsiveBreakPoints.sm, 10);
    if (isMobile) await expect(originX).toBe('');
    else await expect(originX).toContain('calc');
  },
};

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
