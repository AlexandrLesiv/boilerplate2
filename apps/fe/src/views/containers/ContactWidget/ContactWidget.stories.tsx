import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { withAppProviders } from '../../../../.storybook/decorators';
import { ContactWidget } from './ContactWidget';

const meta: Meta<typeof ContactWidget> = {
  title: 'Containers/ContactWidget',
  component: ContactWidget,
  decorators: [withAppProviders()],
  parameters: {
    a11y: { test: 'error' },
  },
};

export default meta;
type Story = StoryObj<typeof ContactWidget>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Ask a question' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await canvas.findByRole('region', { name: 'Chat with us' });
    await expect(canvas.getByText('Hi! How can we help you today?')).toBeInTheDocument();
  },
};

/** Clicking the same button again closes the panel — it's a toggle, not a separate open/close pair. */
export const ClosesOnReclick: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Ask a question' });
    await userEvent.click(trigger);
    await canvas.findByRole('region', { name: 'Chat with us' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/**
 * The panel's own close button — the real-pointer way to close once open, since the trigger
 * itself is fully covered by the panel's content layer once grown. See ContactWidget/AGENTS.md
 * ("Real-mouse consequence").
 */
export const ClosesOnCloseButtonClick: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Ask a question' });
    await userEvent.click(trigger);
    await canvas.findByRole('region', { name: 'Chat with us' });
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Escape closes the panel and returns focus to the trigger — same contract as `MobileNav`. */
export const ClosesOnEscape: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Ask a question' });
    await userEvent.click(trigger);
    await canvas.findByRole('region', { name: 'Chat with us' });
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
  },
};

/** Clicking anywhere outside the panel (and outside the trigger itself) closes it. */
export const ClosesOnOutsideClick: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Ask a question' });
    await userEvent.click(trigger);
    await canvas.findByRole('region', { name: 'Chat with us' });
    await userEvent.click(canvasElement.ownerDocument.body);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const SendMessageGetsScriptedReply: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ask a question' }));
    await canvas.findByRole('region', { name: 'Chat with us' });
    await userEvent.type(canvas.getByLabelText('Message'), 'Do you ship internationally?');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(canvas.getByText('Do you ship internationally?')).toBeInTheDocument();
    await expect(
      await canvas.findByText('Thanks for reaching out! Someone from our team will follow up shortly.')
    ).toBeInTheDocument();
  },
};

/** The browser's native `required` validation blocks an empty send. */
export const EmptyMessageBlocksSend: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ask a question' }));
    const input = await canvas.findByLabelText<HTMLInputElement>('Message');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(input.validity.valid).toBe(false);
  },
};

/** A second message gets the next reply in the rotation, not a repeat of the first. */
export const RepliesRotate: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ask a question' }));
    const input = await canvas.findByLabelText('Message');
    await userEvent.type(input, 'First question');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await canvas.findByText('Thanks for reaching out! Someone from our team will follow up shortly.');

    await userEvent.type(input, 'Second question');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(
      await canvas.findByText("Got it — we'll look into that and get back to you soon.")
    ).toBeInTheDocument();
  },
};
