import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { Abbr } from './Abbr';

const meta: Meta<typeof Abbr> = {
  title: 'Components/Abbr',
  component: Abbr,
  parameters: {
    layout: 'centered',
    a11y: { test: 'error' },
  },
  args: {
    title: 'HyperText Markup Language',
    children: 'HTML',
  },
};

export default meta;
type Story = StoryObj<typeof Abbr>;

export const Default: Story = {};

export const InSentence: Story = {
  render: () => (
    <p>
      This page validates against the <Abbr title="HyperText Markup Language">HTML</Abbr> specification.
    </p>
  ),
};

export const ForwardsHtmlAttributes: Story = {
  args: { id: 'wcag-abbr', title: 'Web Content Accessibility Guidelines', children: 'WCAG' },
  play: async ({ canvas }) => {
    const el = await canvas.findByText('WCAG');
    await expect(el.id).toBe('wcag-abbr');
    await expect(el.getAttribute('title')).toBe('Web Content Accessibility Guidelines');
    await expect(el.tagName).toBe('ABBR');
  },
};
