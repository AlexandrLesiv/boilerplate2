import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect, within } from 'storybook/test';

import { withPageLayout } from '../../../.storybook/decorators';

const meta: Meta = {
  title: 'Layouts/RootLayout',
};

export default meta;
type Story = StoryObj;

/** WCAG 2.5.8 / axe-core's `target-size` rule (`.storybook/preview.tsx` — disabled in axe-core
 * by default, enabled globally there) requires every touch target to be at least 24x24 CSS px.
 * Nav links and locale-switcher links had no vertical padding at all (measured 18.3px / 19.5px
 * tall) until `layouts/styles.css.ts` / `LocaleSwitcher/styles.css.ts` added it. Zero-size
 * elements are filtered out rather than asserted on — the closed login dialog's close button
 * is `0x0` while hidden, and that's a separate concern from the always-visible header controls
 * this story checks. */
export const HeaderTouchTargetsMeetMinimumSize: Story = {
  decorators: [withPageLayout()],
  render: () => <p>Page content</p>,
  play: async ({ canvas }) => {
    const header = await canvas.findByRole('banner');
    await within(header).findByText('EN');

    const targets = Array.from(header.querySelectorAll('a, button')).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    await expect(targets.length).toBeGreaterThan(0);

    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      await expect(rect.height).toBeGreaterThanOrEqual(24);
    }
  },
};
