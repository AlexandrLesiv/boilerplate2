import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { withAppProviders } from '../../../../.storybook/decorators';
import { SkipLinks } from './SkipLinks';

const meta: Meta<typeof SkipLinks> = {
  title: 'Components/SkipLinks',
  component: SkipLinks,
  decorators: [withAppProviders()],
  render: () => (
    <>
      <SkipLinks />
      <main id="main-content" tabindex={-1}>
        Page content
      </main>
    </>
  ),
};

export default meta;
type Story = StoryObj<typeof SkipLinks>;

export const Default: Story = {};

/** Tabbing onto a link brings the whole cluster on-screen via `:focus-within`, and activating it
 * moves focus to `<main>` rather than just scrolling to it. */
export const ActivateJumpsToMain: Story = {
  play: async ({ canvas, userEvent }) => {
    const link = await canvas.findByRole('link', { name: /skip to main content/i });
    await userEvent.click(link);
    const main = canvas.getByText('Page content');
    await expect(main).toHaveFocus();
  },
};
