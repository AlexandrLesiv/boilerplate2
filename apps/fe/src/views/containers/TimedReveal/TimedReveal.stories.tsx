import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { TimedReveal } from './TimedReveal';

const meta: Meta<typeof TimedReveal> = {
  title: 'Containers/TimedReveal',
  component: TimedReveal,
  args: {
    loading: <span>loading slot</span>,
    longLoading: <span>long-loading slot</span>,
  },
};

export default meta;
type Story = StoryObj<typeof TimedReveal>;

/** Nothing renders before `delayMs` — generic slots, so this tests the orchestration alone. */
export const HiddenBeforeDelay: Story = {
  args: { delayMs: 200, slowMs: 400 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('');
  },
};

/** Past `delayMs`, only `loading` shows. */
export const ShowsLoadingSlot: Story = {
  args: { delayMs: 50, slowMs: 5000 },
  play: async ({ canvas }) => {
    await canvas.findByText('loading slot');
    await expect(canvas.queryByText('long-loading slot')).toBeNull();
  },
};

/** Past `slowMs`, `longLoading` joins `loading` — neither replaces the other. */
export const ShowsBothSlotsWhenSlow: Story = {
  args: { delayMs: 20, slowMs: 80 },
  play: async ({ canvas }) => {
    await canvas.findByText('long-loading slot');
    await expect(canvas.queryByText('loading slot')).not.toBeNull();
  },
};
