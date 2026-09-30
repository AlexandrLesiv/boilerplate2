import { createSignal, For } from 'solid-js';

import type { Meta, StoryObj } from 'storybook-solidjs-vite';

import { withAppProviders } from '../../../../.storybook/decorators';
import { Dialog } from './Dialog';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
  decorators: [withAppProviders()],
  args: {
    title: 'Dialog title',
    children: () => <p>Dialog body content.</p>,
  },
  parameters: {
    a11y: { test: 'error' },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = createSignal(true);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open dialog
        </button>
        <Dialog open={open()} onClose={() => setOpen(false)} title="Dialog title">
          {() => <p>Dialog body content.</p>}
        </Dialog>
      </>
    );
  },
  play: async ({ canvas }) => {
    await canvas.findByRole('dialog');
  },
};

/** Long content scrolls inside the panel rather than overflowing the viewport. */
export const LongContent: Story = {
  render: () => {
    const [open, setOpen] = createSignal(true);
    return (
      <Dialog open={open()} onClose={() => setOpen(false)} title="Terms of service">
        {() => (
          // tabindex so the region itself is keyboard-focusable and scrollable without a mouse —
          // axe's scrollable-region-focusable rule, a real a11y requirement, not a quirk of this story.
          <div tabindex={0} style={{ 'max-height': '50vh', overflow: 'auto' }}>
            <For each={Array.from({ length: 40 }, (_, i) => i + 1)}>
              {(n) => <p>Paragraph {n} of a long document.</p>}
            </For>
          </div>
        )}
      </Dialog>
    );
  },
};
