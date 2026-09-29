import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { withAppProviders } from '../../../../.storybook/decorators';
import { Image } from './Image';

const meta: Meta<typeof Image> = {
  title: 'Components/Image',
  component: Image,
  decorators: [withAppProviders()],
  parameters: { layout: 'centered' },
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    width: { control: 'number' },
    height: { control: 'number' },
    preload: { control: 'boolean' },
  },
  args: {
    src: '/assets/favicon/favicon-48x48.png',
    alt: 'The site favicon, enlarged',
    width: 96,
    height: 96,
    preload: false,
  },
};

export default meta;
type Story = StoryObj<typeof Image>;

export const Loaded: Story = {};

/** A path that 404s — the fallback engages after hydration, once the browser fires `error`. */
export const LoadFailure: Story = {
  args: { src: '/assets/does-not-exist.png', alt: 'A photo that never loads' },
  play: async ({ canvas }) => {
    // Proves the swap actually happened, not just that the story mounted: waits for the
    // real async `error` event, then checks the fallback carries the original alt text.
    await canvas.findByRole('img', { name: /failed to load: a photo that never loads/i });
  },
};

/** `alt=""` marks the image decorative — the fallback stays visible but silent for assistive tech. */
export const DecorativeLoadFailure: Story = {
  args: { src: '/assets/does-not-exist.png', alt: '' },
  play: async ({ canvas }) => {
    await canvas.findByText(/image unavailable/i);
    await expect(canvas.queryByRole('img')).toBeNull();
  },
};

/** LCP opt-in: eager + sync decode, high fetch priority, and an SSR `<link rel="preload">`. */
export const Preloaded: Story = {
  args: { preload: true },
  play: async ({ canvas }) => {
    await canvas.findByRole('img', { name: /the site favicon, enlarged/i });
    await expect(document.head.querySelector('link[rel="preload"][as="image"][fetchpriority="high"]')).not.toBeNull();
  },
};

/** A very small box — the fallback degrades to icon-only once the label can't fit. */
export const SmallBox: Story = {
  args: { src: '/assets/does-not-exist.png', alt: 'A tiny thumbnail', width: 32, height: 32 },
};

/** A wide, short crop — checks the fallback and `object-fit: cover` on unusual ratios. */
export const WideAspectRatio: Story = {
  args: { width: 320, height: 96 },
};
