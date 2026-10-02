import { createSignal, For } from 'solid-js';

import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { responsiveBreakPoints } from '@/assets/styles/responsive/breakpoints';

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

/**
 * With `getAnchorElement`, the open/close scale pivots toward the trigger instead of the dialog's
 * own center, so the card visibly grows from the button that opened it. Positioned in a corner
 * (not near the viewport center) so the pivot shift is unmistakable rather than coincidentally
 * close to the default.
 */
export const OpenedFromTrigger: Story = {
  render: () => {
    const [open, setOpen] = createSignal(false);
    let anchorRef: HTMLButtonElement | undefined;
    return (
      <div style={{ position: 'fixed', top: '1rem', left: '1rem' }}>
        <button type="button" ref={(el) => (anchorRef = el)} onClick={() => setOpen(true)}>
          Open dialog
        </button>
        <Dialog open={open()} onClose={() => setOpen(false)} title="Dialog title" getAnchorElement={() => anchorRef}>
          {() => <p>Dialog body content.</p>}
        </Dialog>
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await canvas.findByRole('dialog');
    // Proves the mechanism actually engaged, not just that the dialog opened — a wiring mistake
    // (e.g. the accessor never being called) would still render the dialog correctly but leave
    // these unset. `Dialog.tsx` only applies the anchor at/above `sm`, and the host browser this
    // test runs in — not the Storybook viewport toolbar, which only resizes the preview iframe's
    // CSS box, not the real `window.innerWidth` this check reads — may itself be narrower than
    // that, so this asserts whichever of the two documented outcomes actually applies instead of
    // assuming desktop.
    const originX = getComputedStyle(dialog).getPropertyValue('--dialog-origin-x');
    const isMobile = window.innerWidth < Number.parseInt(responsiveBreakPoints.sm, 10);
    if (isMobile) await expect(originX).toBe('');
    else await expect(originX).toContain('calc');
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
