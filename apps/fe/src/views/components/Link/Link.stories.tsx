import { For } from 'solid-js';

import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import type { InteractiveVariant } from '@/assets/styles/interactiveVariants.css';

import { withAppProviders } from '../../../../.storybook/decorators';
import { Link } from './Link';

const VARIANTS: InteractiveVariant[] = ['link', 'primary', 'secondary', 'ghost'];

const meta: Meta<typeof Link> = {
  title: 'Components/Link',
  component: Link,
  decorators: [withAppProviders()],
  parameters: { layout: 'centered', a11y: { test: 'error' } },
  argTypes: {
    variant: { control: 'select', options: ['link', 'primary', 'secondary', 'ghost'] },
    href: { control: 'text' },
    children: { control: 'text' },
  },
  args: {
    href: 'https://example.com',
    children: 'Visit example.com',
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const link = await canvas.findByRole('link', { name: 'Visit example.com' });
    await expect(link.tagName).toBe('A');
    await expect(link.getAttribute('href')).toBe('https://example.com');
  },
};

/** A real `<a>`, visually a prominent button — the `primary` variant comes from
 * `assets/styles/interactiveVariants.css.ts`, shared with `AppButton`, specifically so a link
 * (real navigation, a real `href`) can wear this look without becoming a `<button>`. */
export const ButtonLooking: Story = {
  args: { variant: 'primary', children: 'Looks like a button, is a link' },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', 'align-items': 'center' }}>
      <For each={VARIANTS}>
        {(variant) => (
          <Link href="https://example.com" variant={variant} data-testid={variant}>
            {variant}
          </Link>
        )}
      </For>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const variant of VARIANTS) {
      const link = await canvas.findByTestId(variant);
      await expect(link.tagName).toBe('A');
    }
  },
};

/** External-link safety attributes and arbitrary HTML attributes both reach the real element,
 * alongside the variant class the component applies itself. */
export const ForwardsHtmlAttributes: Story = {
  args: {
    href: 'https://example.com',
    target: '_blank',
    rel: 'noopener noreferrer',
    id: 'external-link',
    children: 'Opens in a new tab',
  },
  play: async ({ canvas }) => {
    const link = (await canvas.findByRole('link', { name: 'Opens in a new tab' })) as HTMLAnchorElement;
    await expect(link.id).toBe('external-link');
    await expect(link.target).toBe('_blank');
    await expect(link.rel).toBe('noopener noreferrer');
  },
};

/** `external` is a separate, explicit prop from `target`/`rel` — the icon and the
 * "opens in new tab" screen-reader text don't depend on either. See Link/AGENTS.md. */
export const External: Story = {
  args: {
    href: 'https://example.com',
    target: '_blank',
    rel: 'noopener noreferrer',
    external: true,
    children: 'Visit example.com',
  },
  play: async ({ canvas }) => {
    const link = await canvas.findByRole('link', { name: 'Visit example.com Opens in new tab' });
    await expect(link.querySelector('svg')).not.toBeNull();
  },
};
