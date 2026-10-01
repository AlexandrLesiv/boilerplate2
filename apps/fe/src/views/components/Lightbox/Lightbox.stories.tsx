import { createSignal, For } from 'solid-js';

import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { withAppProviders } from '../../../../.storybook/decorators';
import { Image } from '../Image/Image';
import { Lightbox } from './Lightbox';
import type { LightboxItem } from './Lightbox';

interface DemoImage {
  src: string;
  alt: string;
}

// A real photo (not a tiny icon) — demonstrates the grow-from-thumbnail morph with something
// that has room to move, unlike a square favicon. Displayed at a fixed 16:9 below, via
// `Image`'s width/height attributes, regardless of this file's own intrinsic aspect ratio.
const CAT_IMAGE = '/cat-image.jpg';

const demoItems: LightboxItem<DemoImage>[] = [
  { id: 1, data: { src: CAT_IMAGE, alt: 'A cat, photo one' } },
  { id: 2, data: { src: CAT_IMAGE, alt: 'A cat, photo two' } },
  { id: 3, data: { src: CAT_IMAGE, alt: 'A cat, photo three' } },
];

const itemsWithCaption: LightboxItem<DemoImage>[] = [
  { id: 1, data: { src: CAT_IMAGE, alt: 'A cat' }, caption: 'A cat, very enlarged.' },
];

// Demo integration: consumer owns the thumbnail grid, the active-index signal, and the per-item
// trigger refs — Lightbox only renders the overlay. Mirrors how `LoginDialog` consumes `Dialog`.
const Gallery = (props: { items: LightboxItem<DemoImage>[] }) => {
  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const triggers = new Map<string | number, HTMLElement>();

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <For each={props.items}>
          {(item, i) => (
            <button
              type="button"
              ref={(el) => triggers.set(item.id, el)}
              onClick={() => setActiveIndex(i())}
              // `Image` is fluid (`width: 100%`) by design, so the trigger needs its own explicit
              // box — without one, a flex item with no width of its own stretches to fill
              // available space instead of showing a fixed-size thumbnail.
              style={{
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                width: '160px',
                height: '90px',
                'flex-shrink': 0,
              }}
            >
              <Image src={item.data.src} alt={item.data.alt} width={160} height={90} fit="cover" />
            </button>
          )}
        </For>
      </div>
      <Lightbox
        items={props.items}
        activeIndex={activeIndex()}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
        getTriggerElement={(id) => triggers.get(id)}
        renderItem={(item) => (
          <Image src={item().data.src} alt={item().data.alt} width={960} height={540} fit="cover" />
        )}
      />
    </>
  );
};

const meta: Meta<typeof Lightbox<DemoImage>> = {
  title: 'Components/Lightbox',
  component: Lightbox<DemoImage>,
  decorators: [withAppProviders()],
};

export default meta;
type Story = StoryObj<typeof Lightbox<DemoImage>>;

export const Default: Story = {
  render: () => <Gallery items={demoItems} />,
  play: async ({ canvas, userEvent }) => {
    const [thumbnail] = await canvas.findAllByRole('button', { name: /a cat/i });
    await userEvent.click(thumbnail);
    await canvas.findByRole('dialog');
  },
};

/** Next/prev buttons, arrow keys, and Home/End all move the active slide; the counter tracks it. */
export const GalleryNavigation: Story = {
  render: () => <Gallery items={demoItems} />,
  play: async ({ canvas, userEvent }) => {
    const [thumbnail] = await canvas.findAllByRole('button', { name: /a cat/i });
    await userEvent.click(thumbnail);
    await canvas.findByRole('dialog');
    await expect(await canvas.findByText('1 of 3')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: /next image/i }));
    await expect(await canvas.findByText('2 of 3')).toBeInTheDocument();

    await userEvent.keyboard('{ArrowRight}');
    await expect(await canvas.findByText('3 of 3')).toBeInTheDocument();

    await userEvent.keyboard('{Home}');
    await expect(await canvas.findByText('1 of 3')).toBeInTheDocument();

    await userEvent.keyboard('{End}');
    await expect(await canvas.findByText('3 of 3')).toBeInTheDocument();
  },
};

/** An item's `caption` renders under the content and is wired via `aria-describedby`. */
export const WithCaption: Story = {
  render: () => <Gallery items={itemsWithCaption} />,
  play: async ({ canvas, userEvent }) => {
    const [thumbnail] = await canvas.findAllByRole('button', { name: /a cat/i });
    await userEvent.click(thumbnail);
    const dialog = await canvas.findByRole('dialog');
    await expect(canvas.getByText('A cat, very enlarged.')).toBeInTheDocument();
    await expect(dialog).toHaveAttribute('aria-describedby');
  },
};
