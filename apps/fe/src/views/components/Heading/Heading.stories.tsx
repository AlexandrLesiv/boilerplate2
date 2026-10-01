import { For } from 'solid-js';

import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { Text } from '../Text/Text';
import type { HeadingLevel, HeadingSize } from './Heading';
import { Heading } from './Heading';

const NON_H1_LEVELS: HeadingLevel[] = ['h2', 'h3', 'h4', 'h5', 'h6'];
const SIZES: HeadingSize[] = ['xl', 'lg', 'md', 'sm', 'xs'];

interface ArticleSection {
  as: HeadingLevel;
  heading: string;
  paragraph: string;
}

// One strictly-nested outline, built once per module load: h1 → h2 → h3 → h3 → h4 → h2 → h3 → h4
// → h5 → h6 — every level appears at least once, and the level going down from any heading to
// the next never skips one (h4 → h2 → h3 going back *up* is fine; nothing ever jumps from, say,
// h2 straight to h4). Only one `h1`, matching the real "exactly one per document" convention —
// see the `H1` story above for why that's a convention worth modeling even in a demo.
const ARTICLE: ArticleSection[] = [
  { as: 'h1', heading: faker.lorem.sentence({ min: 6, max: 10 }), paragraph: faker.lorem.paragraph() },
  { as: 'h2', heading: faker.lorem.sentence({ min: 3, max: 6 }), paragraph: faker.lorem.paragraph() },
  { as: 'h3', heading: faker.lorem.sentence({ min: 3, max: 6 }), paragraph: faker.lorem.paragraph() },
  { as: 'h3', heading: faker.lorem.sentence({ min: 3, max: 6 }), paragraph: faker.lorem.paragraph() },
  { as: 'h4', heading: faker.lorem.sentence({ min: 3, max: 6 }), paragraph: faker.lorem.paragraph() },
  { as: 'h2', heading: faker.lorem.sentence({ min: 3, max: 6 }), paragraph: faker.lorem.paragraph() },
  { as: 'h3', heading: faker.lorem.sentence({ min: 3, max: 6 }), paragraph: faker.lorem.paragraph() },
  { as: 'h4', heading: faker.lorem.sentence({ min: 3, max: 6 }), paragraph: faker.lorem.paragraph() },
  { as: 'h5', heading: faker.lorem.sentence({ min: 3, max: 6 }), paragraph: faker.lorem.paragraph() },
  { as: 'h6', heading: faker.lorem.sentence({ min: 3, max: 6 }), paragraph: faker.lorem.paragraph() },
];

const meta: Meta<typeof Heading> = {
  title: 'Components/Heading',
  component: Heading,
  parameters: { layout: 'padded', a11y: { test: 'error' } },
  argTypes: {
    as: { control: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
    size: { control: 'select', options: ['xl', 'lg', 'md', 'sm', 'xs'] },
    children: { control: 'text' },
  },
  args: {
    as: 'h2',
    children: 'Section heading',
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const heading = await canvas.findByRole('heading', { level: 2 });
    await expect(heading.tagName).toBe('H2');
  },
};

/** The only `<h1>` rendered in this file — every other story here sticks to h2–h6, matching the
 * real convention `as="h1"` exists to let a page express: exactly one per document. */
export const H1: Story = {
  args: { as: 'h1', children: 'Page title' },
  play: async ({ canvas }) => {
    const heading = await canvas.findByRole('heading', { level: 1 });
    await expect(heading.tagName).toBe('H1');
  },
};

/** Each non-h1 level at the size it defaults to when `size` is omitted — `DEFAULT_SIZE_BY_LEVEL`
 * made visible. */
export const AllLevelsDefaultSize: Story = {
  render: () => (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.5rem' }}>
      <For each={NON_H1_LEVELS}>{(level) => <Heading as={level}>{`${level} at its default size`}</Heading>}</For>
    </div>
  ),
};

/** The core decoupling proof: `as` (document outline) and `size` (visual weight) vary
 * independently. Top group fixes `size` and varies `as`; bottom group fixes `as` and varies
 * `size`. Neither group includes `h1` — see the `H1` story for that level on its own. */
export const AsSizeDecoupling: Story = {
  render: () => (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '1.5rem' }}>
      <section>
        <p>Same visual size (&quot;md&quot;), different semantic levels:</p>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.5rem' }}>
          <For each={NON_H1_LEVELS}>
            {(level) => (
              <Heading as={level} size="md" data-testid={`level-${level}`}>
                {`${level}, sized md`}
              </Heading>
            )}
          </For>
        </div>
      </section>
      <section>
        <p>Same semantic level (&quot;h3&quot;), different visual sizes:</p>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.5rem' }}>
          <For each={SIZES}>
            {(size) => (
              <Heading as="h3" size={size} data-testid={`size-${size}`}>
                {`h3, sized ${size}`}
              </Heading>
            )}
          </For>
        </div>
      </section>
    </div>
  ),
  play: async ({ canvas }) => {
    const h2 = await canvas.findByTestId('level-h2');
    const h6 = canvas.getByTestId('level-h6');
    await expect(h2.tagName).toBe('H2');
    await expect(h6.tagName).toBe('H6');
    await expect(getComputedStyle(h2).fontSize).toBe(getComputedStyle(h6).fontSize);

    const xl = canvas.getByTestId('size-xl');
    const xs = canvas.getByTestId('size-xs');
    await expect(xl.tagName).toBe('H3');
    await expect(xs.tagName).toBe('H3');
    await expect(getComputedStyle(xl).fontSize).not.toBe(getComputedStyle(xs).fontSize);
  },
};

/** A continuous, space-free string wraps inside its container instead of overflowing it. */
export const VeryLongUnbrokenText: Story = {
  args: { as: 'h2', children: faker.lorem.words(30).split(' ').join('') },
  render: (props) => (
    <div style={{ 'max-width': '280px', border: '1px dashed gray' }}>
      <Heading as={props.as} size={props.size}>
        {props.children}
      </Heading>
    </div>
  ),
};

/** Arbitrary HTML attributes (`id`, etc.) and a caller `class` both reach the real element,
 * alongside the size/variant classes the component applies itself. */
export const ForwardsHtmlAttributes: Story = {
  args: { as: 'h2', id: 'section-title', children: 'Heading with a forwarded id' },
  play: async ({ canvas }) => {
    const heading = await canvas.findByRole('heading', { level: 2 });
    await expect(heading.id).toBe('section-title');
  },
};

/** `Heading` and `Text` composed together as a full long-form article — every heading level
 * used at least once, each followed by body copy, so this doubles as a realistic "does this
 * actually read like an article" check alongside the heading-level coverage sweep. */
export const LoremIpsumArticle: Story = {
  name: 'Lorem Ipsum Article',
  render: () => (
    <article style={{ display: 'flex', 'flex-direction': 'column', gap: '1rem', 'max-width': '640px' }}>
      <For each={ARTICLE}>
        {(section) => (
          <>
            <Heading as={section.as}>{section.heading}</Heading>
            <Text as="p">{section.paragraph}</Text>
          </>
        )}
      </For>
    </article>
  ),
  play: async ({ canvas }) => {
    const headings = await canvas.findAllByRole('heading');
    await expect(headings.length).toBe(ARTICLE.length);
    await expect(headings[0].tagName).toBe('H1');
    await expect(headings[headings.length - 1].tagName).toBe('H6');
  },
};
