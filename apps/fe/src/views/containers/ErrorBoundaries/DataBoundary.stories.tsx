import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect, fn } from 'storybook/test';

import type { ApiResult } from '@/common/libs/api';

import { withAppProviders } from '../../../../.storybook/decorators';
import { DataBoundary } from './DataBoundary';

type Payload = { title: string };

const meta: Meta = {
  title: 'Containers/DataBoundary',
  decorators: [withAppProviders()],
};

export default meta;
type Story = StoryObj;

const boundary = (result: ApiResult<Payload> | undefined, onRetry?: () => void) => () => (
  <DataBoundary<Payload> result={result} keepStatus onRetry={onRetry}>
    {(data) => <p>{data().title}</p>}
  </DataBoundary>
);

export const Loaded: Story = { render: boundary({ ok: true, data: { title: 'Loaded' } }) };

/** `undefined` result — the boundary shows its pending state. */
export const Pending: Story = { render: boundary(undefined) };

export const Unauthorized: Story = { render: boundary({ ok: false, status: 401 }) };
export const Forbidden: Story = { render: boundary({ ok: false, status: 403 }) };
export const NotFound: Story = { render: boundary({ ok: false, status: 404 }) };
export const RateLimited: Story = { render: boundary({ ok: false, status: 429 }) };
export const ServiceUnavailable: Story = { render: boundary({ ok: false, status: 503 }) };

/** An undeclared status falls back to the 500 page rather than showing nothing. */
export const UnmappedStatus: Story = { render: boundary({ ok: false, status: 507 }) };

/** No response at all — `status: null` maps to the offline page. */
export const Offline: Story = { render: boundary({ ok: false, status: null }) };

/** A retryable kind with `onRetry` set shows "Try again", and clicking it calls the callback. */
export const RetryableWithOnRetry: StoryObj<{ onRetry: () => void }> = {
  args: { onRetry: fn() },
  render: (args) => boundary({ ok: false, status: 503 }, args.onRetry)(),
  play: async ({ canvas, userEvent, args }) => {
    const button = await canvas.findByRole('button', { name: 'Try again' });
    await userEvent.click(button);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

/** No `onRetry` — no retry action is rendered, even for a retryable kind. */
export const RetryableWithoutOnRetry: Story = {
  render: boundary({ ok: false, status: 503 }),
  play: async ({ canvas }) => {
    await canvas.findByText('503');
    await expect(canvas.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  },
};

/** 404 is not retryable — sending the same request again can't find a page that doesn't exist. */
export const NotRetryable: Story = {
  render: boundary({ ok: false, status: 404 }, fn()),
  play: async ({ canvas }) => {
    await canvas.findByText('404');
    await expect(canvas.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  },
};
