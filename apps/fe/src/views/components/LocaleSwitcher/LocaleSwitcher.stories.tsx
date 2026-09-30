import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { withAppProviders } from '../../../../.storybook/decorators';
import { LocaleSwitcher } from './LocaleSwitcher';
import * as styles from './styles.css';

const meta: Meta<typeof LocaleSwitcher> = {
  title: 'Components/LocaleSwitcher',
  component: LocaleSwitcher,
  decorators: [withAppProviders()],
};

export default meta;
type Story = StoryObj<typeof LocaleSwitcher>;

export const Default: Story = {};

/** The active link is visually distinct (background + color), but must render at the same width
 * as the inactive style for the same text — otherwise every click changes that link's own box
 * size, which is a layout shift entirely of this component's own making, independent of the
 * translated-text-length shift switching locale also causes. No router navigation needed to
 * observe this: it's a pure style-variant comparison. */
export const ActiveAndInactiveShareWidth: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <span data-testid="active" class={[styles.localeLink, styles.localeLinkVariants.active].join(' ')}>
        EN
      </span>
      <span data-testid="inactive" class={[styles.localeLink, styles.localeLinkVariants.inactive].join(' ')}>
        EN
      </span>
    </div>
  ),
  play: async ({ canvas }) => {
    const active = await canvas.findByTestId('active');
    const inactive = canvas.getByTestId('inactive');
    await expect(active.getBoundingClientRect().width).toBe(inactive.getBoundingClientRect().width);
  },
};
