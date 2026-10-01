import type { Meta, StoryObj } from 'storybook-solidjs-vite';

import { AppButton } from './AppButton';

const meta: Meta<typeof AppButton> = {
  title: 'Components/AppButton',
  component: AppButton,
  parameters: {
    layout: 'centered',
    a11y: { test: 'error' },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'link'],
    },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    children: 'Button',
    variant: 'primary',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof AppButton>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
};

export const Disabled: Story = {
  args: { variant: 'primary', children: 'Disabled', disabled: true },
};

/** A real `<button>`, visually indistinguishable from a plain inline link — the `link` variant
 * comes from `assets/styles/interactiveVariants.css.ts`, shared with `Link`, specifically so a
 * `<button>` can wear this look without becoming an `<a>` (a "Cancel" action sitting inside a
 * sentence, not a boxed CTA, that still needs to behave like a button — no `href`, no navigation).
 * See Link/AGENTS.md. */
export const LinkLooking: Story = {
  args: { variant: 'link', children: 'Looks like a link, is a button' },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', 'align-items': 'center' }}>
      <AppButton variant="primary">Primary</AppButton>
      <AppButton variant="secondary">Secondary</AppButton>
      <AppButton variant="ghost">Ghost</AppButton>
      <AppButton variant="link">Link-looking</AppButton>
      <AppButton variant="primary" disabled>
        Disabled
      </AppButton>
    </div>
  ),
};
