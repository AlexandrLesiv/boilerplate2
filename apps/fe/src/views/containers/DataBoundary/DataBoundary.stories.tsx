import type { Meta, StoryObj } from 'storybook-solidjs-vite';

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

const boundary = (result: ApiResult<Payload> | undefined) => () => (
  <DataBoundary<Payload> result={result} keepStatus>
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
