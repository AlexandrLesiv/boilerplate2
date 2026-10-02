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
    await userEvent.click(canvas.getByRole('button', { name: 'Ask a question' }));
    await canvas.findByRole('dialog');
    await expect(canvas.getByText('Hi! How can we help you today?')).toBeInTheDocument();
  },
};

/** Sending a message shows it immediately, then a scripted reply arrives after a short delay. */
export const SendMessageGetsScriptedReply: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ask a question' }));
    await canvas.findByRole('dialog');
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
