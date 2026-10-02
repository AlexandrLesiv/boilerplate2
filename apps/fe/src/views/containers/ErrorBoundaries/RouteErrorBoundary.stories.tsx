import type { JSX } from 'solid-js';
import { untrack } from 'solid-js';

import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect, userEvent } from 'storybook/test';

import type { ConnectivityState } from '@/common/libs/connectivity';
import { ConnectivityContext } from '@/common/libs/connectivity';
import { ApiError } from '@/common/libs/fetch';
import { ChunkLoadError } from '@/common/libs/router';

import { withAppProviders } from '../../../../.storybook/decorators';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const meta: Meta = {
  title: 'Containers/RouteErrorBoundary',
  decorators: [withAppProviders()],
  beforeEach: () => {
    hasThrownOnce = false;
  },
};

export default meta;
type Story = StoryObj;

/** Throws on every render — mirrors a `ChunkLoadError`, which can never recover via a soft `reset()`.
 * `untrack`: this throws once at mount and is never meant to react to a later prop change. */
const AlwaysThrows = (props: { error: Error }) => {
  throw untrack(() => props.error);
};

let hasThrownOnce = false;
/** Throws exactly once per story, then renders — mirrors a transient render error a plain `reset()` can recover from. */
const ThrowsOnce = () => {
  if (!hasThrownOnce) {
    hasThrownOnce = true;
    throw new Error('transient render failure');
  }
  return <p>Recovered</p>;
};

const withConnectivity = (state: ConnectivityState, children: () => JSX.Element) => () => (
  <ConnectivityContext.Provider value={{ state: () => state }}>{children()}</ConnectivityContext.Provider>
);

export const RendersChildren: Story = {
  render: () => <RouteErrorBoundary>Hello</RouteErrorBoundary>,
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Hello')).toBeInTheDocument();
  },
};

/** A non-chunk error retries via the boundary's own `reset()` — the child gets a fresh render and can recover. */
export const GenericErrorRecoversOnRetry: Story = {
  render: () => (
    <RouteErrorBoundary>
      <ThrowsOnce />
    </RouteErrorBoundary>
  ),
  play: async ({ canvas }) => {
    await canvas.findByText('Unexpected error');
    const button = await canvas.findByRole('button', { name: 'Try again' });
    await userEvent.click(button);
    await expect(await canvas.findByText('Recovered')).toBeInTheDocument();
  },
};

/** A thrown `ApiError` resolves its own kind from its status, same as `DataBoundary` — 404 has no retry action. */
export const NotFoundApiErrorIsNotRetryable: Story = {
  render: () => (
    <RouteErrorBoundary>
      <AlwaysThrows error={new ApiError(404, 'Not found')} />
    </RouteErrorBoundary>
  ),
  play: async ({ canvas }) => {
    await canvas.findByText('404');
    await expect(canvas.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  },
};

/**
 * Offline + a failed chunk import renders the `offline` kind. Retry reloads the document instead
 * of resetting — a failed dynamic `import()` is permanently cached by the browser's own module
 * registry, so no soft reset can recover it (see this folder's `AGENTS.md`) — but that call isn't
 * exercised here: both plain assignment and `Object.defineProperty` on `window.location.reload`
 * throw in this Vitest-browser harness (`Cannot redefine property: reload`), unlike a real browser.
 * The kind/button assertions below are what the harness can verify; the actual reload-vs-reset
 * branch was confirmed live against the running production build instead.
 */
export const ChunkLoadErrorWhileOffline: Story = {
  render: withConnectivity('offline', () => (
    <RouteErrorBoundary>
      <AlwaysThrows error={new ChunkLoadError(new TypeError('Failed to fetch dynamically imported module'))} />
    </RouteErrorBoundary>
  )),
  play: async ({ canvas }) => {
    await canvas.findByText('You appear to be offline');
    await expect(await canvas.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  },
};

/** Same chunk failure while online resolves to `unknown` instead of `offline` — same retry-reloads behavior either way. */
export const ChunkLoadErrorWhileOnline: Story = {
  render: withConnectivity('online', () => (
    <RouteErrorBoundary>
      <AlwaysThrows error={new ChunkLoadError(new TypeError('Failed to fetch dynamically imported module'))} />
    </RouteErrorBoundary>
  )),
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  },
};
