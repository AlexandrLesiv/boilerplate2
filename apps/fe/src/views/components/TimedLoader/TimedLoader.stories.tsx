import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { withAppProviders } from '../../../../.storybook/decorators';
import { TimedLoader } from './TimedLoader';

const meta: Meta<typeof TimedLoader> = {
  title: 'Components/TimedLoader',
  component: TimedLoader,
  decorators: [withAppProviders()],
};

export default meta;
type Story = StoryObj<typeof TimedLoader>;

/** Real defaults (1s / 5s) — for visual inspection, not asserted here since that would mean a
 * 5+ second test. See `ShowsAfterDelay` / `EscalatesWhenSlow` for the timed-staging assertions,
 * run with tiny overrides instead of the real thresholds. */
export const Default: Story = {};

/** Nothing renders before `delayMs` — a load this fast should look instant, not flash a spinner. */
export const HiddenBeforeDelay: Story = {
  args: { delayMs: 200, slowMs: 400 },
  play: async ({ canvas }) => {
    const region = canvas.getByRole('status');
    await expect(region).toHaveTextContent('');
  },
};

/** Past `delayMs`, the spinner and base message appear. `findByText`, not `findByRole('status')`
 * — the region exists from t=0 (see the component's a11y note), so waiting on the element alone
 * would resolve immediately and race the timer; waiting on the text polls until it actually
 * appears. */
export const ShowsAfterDelay: Story = {
  args: { delayMs: 50, slowMs: 5000 },
  play: async ({ canvas }) => {
    await canvas.findByText(/loading/i);
    await expect(canvas.queryByText(/longer than usual/i)).toBeNull();
  },
};

/** Past `slowMs`, the reassurance line joins the spinner rather than replacing it. */
export const EscalatesWhenSlow: Story = {
  args: { delayMs: 20, slowMs: 80 },
  play: async ({ canvas }) => {
    await canvas.findByText(/longer than usual/i);
    await expect(canvas.queryByText(/loading/i)).not.toBeNull();
  },
};
