import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import type { ConnectivityState } from '@/common/libs/connectivity';
import { ConnectivityContext } from '@/common/libs/connectivity';

import { withAppProviders } from '../../../../.storybook/decorators';
import { OfflineStatus } from './OfflineStatus';

const meta: Meta<typeof OfflineStatus> = {
  title: 'Containers/OfflineStatus',
  component: OfflineStatus,
  decorators: [withAppProviders()],
};

export default meta;
type Story = StoryObj<typeof OfflineStatus>;

/** Real store (from `withAppProviders`), online by default — the live region exists but is empty. */
export const Online: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('status')).not.toBeNull();
    await expect(canvas.queryByText(/offline|back online/i)).toBeNull();
  },
};

/** Proves the real store's browser-event wiring, not just the component's rendering. */
export const ConnectivityWiring: Story = {
  play: async ({ canvas }) => {
    window.dispatchEvent(new Event('offline'));
    await expect(await canvas.findByRole('status')).toHaveTextContent(/offline/i);
    window.dispatchEvent(new Event('online'));
    await expect(await canvas.findByRole('status')).toHaveTextContent(/back online/i);
  },
};

/** Injects state directly through `ConnectivityContext` — no `window` events involved, so this
 * exercises exactly and only what `OfflineStatus` renders per state. */
const withInjectedState = (state: ConnectivityState) => () => (
  <ConnectivityContext.Provider value={{ state: () => state }}>
    <OfflineStatus />
  </ConnectivityContext.Provider>
);

export const OfflineState: Story = {
  render: withInjectedState('offline'),
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('status')).toHaveTextContent(/offline/i);
  },
};

export const ReconnectedState: Story = {
  render: withInjectedState('reconnected'),
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('status')).toHaveTextContent(/back online/i);
  },
};
