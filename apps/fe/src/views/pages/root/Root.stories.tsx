import type { Meta, StoryObj } from 'storybook-solidjs-vite';

import { withPageLayout } from '../../../../.storybook/decorators';
import Root from './Root';

const meta: Meta<typeof Root> = {
  title: 'Pages/Home',
  component: Root,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Root>;

export const GuestUser: Story = {
  decorators: [withPageLayout()],
  play: async ({ canvas }) => {
    await canvas.findByRole('main');
  },
};

export const LoggedInUser: Story = {
  decorators: [withPageLayout({ user: { id: '1', email: 'alex@example.com' } })],
  play: async ({ canvas }) => {
    await canvas.findByRole('main');
  },
};
