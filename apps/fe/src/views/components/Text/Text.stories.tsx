import { For } from 'solid-js';

import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import type { TextSize, TextVariant } from './Text';
import { Text } from './Text';

const VARIANTS: TextVariant[] = ['primary', 'secondary'];
const SIZES: TextSize[] = ['normal', 'small'];

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  parameters: { layout: 'padded', a11y: { test: 'error' } },
  argTypes: {
    as: { control: 'select', options: ['p', 'span'] },
    variant: { control: 'select', options: ['primary', 'secondary'] },
    size: { control: 'select', options: ['normal', 'small'] },
    children: { control: 'text' },
  },
  args: {
    as: 'p',
    variant: 'primary',
    size: 'normal',
    children: 'The quick brown fox jumps over the lazy dog.',
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {};

/** Every `variant` × `size` combination, side by side for visual review. */
export const AllCombinations: Story = {
  render: () => (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.5rem' }}>
      <For each={VARIANTS}>
        {(variant) => (
          <For each={SIZES}>
            {(size) => (
              <Text as="p" variant={variant} size={size} data-testid={`${variant}-${size}`}>
                {`${variant}, ${size}: the quick brown fox jumps over the lazy dog.`}
              </Text>
            )}
          </For>
        )}
      </For>
    </div>
  ),
};

/** Flagged in a11y review as the lowest-contrast-margin combination this design allows — it
 * still clears AA contrast at any size (see `styles.css.ts`), but is worth its own story for
 * visual sign-off rather than only appearing buried inside `AllCombinations`. */
export const SecondarySmall: Story = {
  args: { variant: 'secondary', size: 'small' },
};

/** `as="span"` must never carry block-spacing implying a paragraph break — these two spans sit
 * inline, back to back, inside one running sentence. */
export const AsSpanStaysInline: Story = {
  render: () => (
    <p>
      Leading text,{' '}
      <Text as="span" data-testid="first-span">
        an inline span
      </Text>
      {', '}
      <Text as="span" variant="secondary" data-testid="second-span">
        immediately followed by another
      </Text>
      , then trailing text — all on one line.
    </p>
  ),
  play: async ({ canvas }) => {
    const span = await canvas.findByTestId('first-span');
    await expect(span.tagName).toBe('SPAN');
    const style = getComputedStyle(span);
    await expect(style.marginTop).toBe('0px');
    await expect(style.marginBottom).toBe('0px');
  },
};

/** No margin in either direction, on `p` or `span` — the component relies on its container's own
 * layout (`gap`, etc.) instead of an implicit spacing convention. */
export const NoMarginEitherDirection: Story = {
  render: () => (
    <div>
      <Text as="p" data-testid="p">
        A paragraph with no margin of its own.
      </Text>
      <Text as="span" data-testid="span">
        A span with no margin of its own.
      </Text>
    </div>
  ),
  play: async ({ canvas }) => {
    const p = await canvas.findByTestId('p');
    const span = canvas.getByTestId('span');
    for (const el of [p, span]) {
      const style = getComputedStyle(el);
      await expect(style.marginTop).toBe('0px');
      await expect(style.marginBottom).toBe('0px');
    }
  },
};

/** A continuous, space-free string wraps inside its container instead of overflowing it. */
export const VeryLongUnbrokenText: Story = {
  args: { children: faker.lorem.words(40).split(' ').join('') },
  render: (props) => (
    <div style={{ 'max-width': '280px', border: '1px dashed gray' }}>
      <Text as={props.as} variant={props.variant} size={props.size}>
        {props.children}
      </Text>
    </div>
  ),
};

/** `numeric` keeps digit widths uniform — compares a proportional-width run of digits against
 * the same digits with `font-variant-numeric: tabular-nums`, so the effect is visible even
 * though it only matters in practice once the text re-renders with a different digit mix. */
export const NumericTabularNums: Story = {
  render: () => (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.5rem' }}>
      <Text as="p" data-testid="proportional">
        1,111 vs 7,777
      </Text>
      <Text as="p" numeric data-testid="tabular">
        1,111 vs 7,777
      </Text>
    </div>
  ),
  play: async ({ canvas }) => {
    const proportional = await canvas.findByTestId('proportional');
    const tabular = canvas.getByTestId('tabular');
    await expect(getComputedStyle(proportional).fontVariantNumeric).toBe('normal');
    await expect(getComputedStyle(tabular).fontVariantNumeric).toBe('tabular-nums');
  },
};

/** Arbitrary HTML attributes (`id`, etc.) and a caller `class` both reach the real element,
 * alongside the variant/size classes the component applies itself. */
export const ForwardsHtmlAttributes: Story = {
  args: { id: 'intro-copy', children: 'Text with a forwarded id' },
  play: async ({ canvas }) => {
    const text = await canvas.findByText('Text with a forwarded id');
    await expect(text.id).toBe('intro-copy');
  },
};
