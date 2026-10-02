import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { withAppProviders } from '../../../../.storybook/decorators';
import { HeaderNav } from './HeaderNav';

const meta: Meta<typeof HeaderNav> = {
  title: 'Components/HeaderNav',
  component: HeaderNav,
  decorators: [withAppProviders()],
};

export default meta;
type Story = StoryObj<typeof HeaderNav>;

/**
 * This Storybook test environment's own browser window is narrower than the `sm` breakpoint
 * (see MobileNav/AGENTS.md), so `MobileNav`'s links start collapsed — open it first, same as
 * `MobileNav.stories.tsx`'s own stories. `findByRole` with a `name` filter is also what makes
 * this wait for the real locale to resolve, rather than for "SolidJS App" (a static string that
 * renders instantly regardless of translation state and would prove nothing about it).
 */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const toggle = await canvas.findByRole('button', { name: 'Menu' });
    await userEvent.click(toggle);
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    await expect(canvas.getByRole('link', { name: 'News' })).toHaveAttribute('href', '/news');
  },
};

/** Non-default locales prefix both links — same `pfx()` derivation `LocaleSwitcher` relies on. */
export const UkrainianLocale: Story = {
  decorators: [withAppProviders({ path: '/:locale?', initialPath: '/ua', locale: 'ua' })],
  play: async ({ canvas, userEvent }) => {
    const toggle = await canvas.findByRole('button', { name: 'Меню' });
    await userEvent.click(toggle);
    await expect(canvas.getByRole('link', { name: 'Новини' })).toHaveAttribute('href', '/ua/news');
  },
};
