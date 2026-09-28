import type { Meta, StoryObj } from 'storybook-solidjs-vite';

import { withAppProviders } from '../../../../.storybook/decorators';
import { AppButton } from '../Button/AppButton';
import { ErrorState } from './ErrorState';
import { ERROR_KINDS } from './kinds';

/**
 * A placeholder page per error, each reusing `ErrorLayout` and carrying the same `SupportPrompt`.
 * `keepStatus` is on throughout so the stories do not rewrite Storybook's own response status.
 */
const meta: Meta<typeof ErrorState> = {
  title: 'Components/ErrorState',
  component: ErrorState,
  decorators: [withAppProviders()],
  argTypes: {
    kind: { control: 'select', options: [...ERROR_KINDS] },
  },
  args: { kind: '500', keepStatus: true },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

/** Pick any error from the controls panel. */
export const Default: Story = {};

export const BadRequest: Story = { args: { kind: '400' } };
export const Unauthorized: Story = { args: { kind: '401' } };
export const Forbidden: Story = { args: { kind: '403' } };
export const NotFound: Story = { args: { kind: '404' } };
export const RequestTimeout: Story = { args: { kind: '408' } };
export const TooManyRequests: Story = { args: { kind: '429' } };
export const ServerError: Story = { args: { kind: '500' } };
export const NotImplemented: Story = { args: { kind: '501' } };
export const BadGateway: Story = { args: { kind: '502' } };
export const ServiceUnavailable: Story = { args: { kind: '503' } };
export const GatewayTimeout: Story = { args: { kind: '504' } };
export const Offline: Story = { args: { kind: 'offline' } };
export const Unknown: Story = { args: { kind: 'unknown' } };

/** A status-specific action next to the home link — what the per-status components are for. */
export const WithExtraAction: Story = {
  args: {
    kind: '401',
    actions: <AppButton variant="primary">Sign in</AppButton>,
  },
};

/** Copy comes from the translations, so every error page localises. */
export const Ukrainian: Story = {
  decorators: [withAppProviders({ locale: 'ua' })],
  args: { kind: '503' },
};

/** The layout is sized by its container, not the viewport. */
export const InNarrowContainer: Story = {
  args: { kind: '503' },
  // Only the wrapper here — meta already applies withAppProviders, and story decorators compose
  // with it rather than replacing it.
  decorators: [
    (Story) => (
      <div style={{ width: '260px', border: '1px dashed #94a3b8', padding: '0.75rem' }}>
        <Story />
      </div>
    ),
  ],
};
