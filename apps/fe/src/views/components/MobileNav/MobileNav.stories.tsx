import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { MobileNav } from './MobileNav';

const meta: Meta<typeof MobileNav> = {
  title: 'Components/MobileNav',
  component: MobileNav,
  args: {
    label: 'Menu',
    // `href="#"`, not a real path — a real navigation in this vitest-browser test environment
    // would take the whole tab away from the test harness mid-run. `ClosesOnLinkClick` is the
    // one story that actually clicks these.
    children: (
      <>
        <a href="#" onClick={(event) => event.preventDefault()}>
          Home
        </a>
        <a href="#" onClick={(event) => event.preventDefault()}>
          News
        </a>
      </>
    ),
  },
  parameters: {
    a11y: { test: 'error' },
  },
};

export default meta;
type Story = StoryObj<typeof MobileNav>;

/**
 * This Storybook test environment's own browser window is narrower than the `sm` breakpoint
 * (confirmed live, not assumed — see Dialog/AGENTS.md's identical note about the viewport
 * toolbar global not affecting the real `window.innerWidth` these stories render at), so every
 * story in this file exercises the collapsed/toggle behavior. The always-expanded desktop case
 * (`display: none` on the toggle, `nav` always visible) was verified instead via a throwaway
 * Playwright probe at a real wide viewport — see MobileNav/AGENTS.md.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const toggle = await canvas.findByRole('button', { name: 'Menu' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // `display: none` while collapsed removes it from the accessibility tree entirely — a real
    // screen reader wouldn't see it either, so this isn't a testing artifact to work around.
    await expect(canvas.queryByRole('navigation', { name: 'Menu' })).not.toBeInTheDocument();
  },
};

export const OpensOnToggleClick: Story = {
  play: async ({ canvas, userEvent }) => {
    const toggle = await canvas.findByRole('button', { name: 'Menu' });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const nav = await canvas.findByRole('navigation', { name: 'Menu' });
    await expect(nav).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'News' })).toBeVisible();
  },
};

/** Clicking a link inside closes the menu — a caller never has to wire this per link. */
export const ClosesOnLinkClick: Story = {
  play: async ({ canvas, userEvent }) => {
    const toggle = await canvas.findByRole('button', { name: 'Menu' });
    await userEvent.click(toggle);
    await userEvent.click(await canvas.findByRole('link', { name: 'News' }));
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Escape closes the menu and returns focus to the toggle button. */
export const ClosesOnEscape: Story = {
  play: async ({ canvas, userEvent }) => {
    const toggle = await canvas.findByRole('button', { name: 'Menu' });
    await userEvent.click(toggle);
    await canvas.findByRole('navigation', { name: 'Menu' });
    await userEvent.keyboard('{Escape}');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveFocus();
  },
};

/** Clicking anywhere outside the component closes an open menu. */
export const ClosesOnOutsideClick: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const toggle = await canvas.findByRole('button', { name: 'Menu' });
    await userEvent.click(toggle);
    await canvas.findByRole('navigation', { name: 'Menu' });
    await userEvent.click(canvasElement.ownerDocument.body);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  },
};
