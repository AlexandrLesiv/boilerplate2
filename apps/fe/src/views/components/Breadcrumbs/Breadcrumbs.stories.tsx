import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { withAppProviders } from '../../../../.storybook/decorators';
import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  decorators: [withAppProviders()],
  parameters: {
    a11y: { test: 'error' },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'News', href: '/news' },
      { label: 'Why the sky is blue', href: '/news/123' },
    ],
  },
  play: async ({ canvas }) => {
    const nav = await canvas.findByRole('navigation', { name: 'Breadcrumb' });
    await expect(nav).toBeInTheDocument();
    // Trail items are real links...
    await expect(canvas.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'News' })).toBeInTheDocument();
    // ...the current page is not — same text, no link, marked `aria-current="page"`.
    const current = canvas.getByText('Why the sky is blue');
    await expect(current.tagName).not.toBe('A');
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(canvas.queryByRole('link', { name: 'Why the sky is blue' })).not.toBeInTheDocument();
  },
};

/** A single entry — the site root with nothing beneath it. Still renders as plain current-page
 * text, never as a self-link. */
export const SingleItem: Story = {
  args: {
    items: [{ label: 'Home', href: '/' }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link')).not.toBeInTheDocument();
    await expect(canvas.getByText('Home')).toHaveAttribute('aria-current', 'page');
  },
};

/** No items at all — renders nothing, not an empty `nav`/`ol` landmark. */
export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('navigation')).not.toBeInTheDocument();
  },
};

/** A long article-title-length current page wraps onto a new line instead of overflowing or
 * pushing the trail off-screen — same "no truncation" default `Text`/`Heading` use elsewhere. */
export const LongCurrentPageLabel: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'News', href: '/news' },
      {
        label:
          'An extremely long article title that keeps going and going and should wrap cleanly onto multiple lines without breaking the layout',
        href: '/news/456',
      },
    ],
  },
};
