import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';

import { Title } from '@solidjs/meta';
import { A, createAsync, revalidate, useParams } from '@solidjs/router';

import { format, useI18n } from '@/common/libs/i18n';
import { Image } from '@/views/components/Image/Image';
import { Lightbox } from '@/views/components/Lightbox/Lightbox';
import type { LightboxItem } from '@/views/components/Lightbox/Lightbox';
import { DataBoundary } from '@/views/containers/DataBoundary/DataBoundary';

import { getArticle } from '../api';

interface CoverImage {
  src: string;
  alt: string;
}

// Hacker News items carry no images of their own — these are fixed illustrations, not article
// data, purely to exercise Lightbox's gallery navigation against real photos in the running app.
const COVER_IMAGES: CoverImage[] = [
  { src: '/cat-image.jpg', alt: 'A cat' },
  { src: '/Greycat.jpg', alt: 'A grey cat' },
];

// Both thumbnail and enlarged view crop via `fit="cover"` — consistent framing across every
// photo regardless of its own aspect ratio, deliberately accepting cropping over `contain`'s
// alternative (show the full photo, but let letterboxing vary per photo's own shape, which read
// as "images are randomly different sizes" rather than "images are different shapes").
// `FULL_SIZE` is just a sizing hint for the box, not the photo's real dimensions.
const THUMBNAIL_SIZE = { width: 160, height: 90 };
const FULL_SIZE = { width: 960, height: 540 };

const ArticlePage: Component = () => {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const article = createAsync(() => getArticle({ params: { id: Number(params.id) } }));
  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const coverTriggers = new Map<string | number, HTMLElement>();

  return (
    <DataBoundary result={article()} onRetry={() => revalidate(getArticle.key)}>
      {(res) => {
        const a = () => res().data;
        const coverItems: LightboxItem<CoverImage>[] = COVER_IMAGES.map((image, index) => ({
          id: index,
          data: image,
          caption: a().title,
        }));
        return (
          <div>
            <Title>{a().title}</Title>
            <h1>
              <Show when={a().url} fallback={a().title}>
                <a href={a().url} target="_blank" rel="noopener noreferrer">
                  {a().title}
                </a>
              </Show>
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <For each={coverItems}>
                {(item, index) => (
                  <button
                    type="button"
                    ref={(el) => coverTriggers.set(item.id, el)}
                    onClick={() => setActiveIndex(index())}
                    style={{
                      padding: 0,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      // `Image` is fluid (`width: 100%`) by design — it fills whatever box it's
                      // given, it doesn't impose one. Without an explicit size here, this button
                      // (a flex item with no width of its own) stretched to fill available flex
                      // space instead of showing a 160x90 thumbnail.
                      width: `${THUMBNAIL_SIZE.width}px`,
                      height: `${THUMBNAIL_SIZE.height}px`,
                      'flex-shrink': 0,
                    }}
                  >
                    <Image
                      src={item.data.src}
                      alt={t().pages.article.imageAlt}
                      width={THUMBNAIL_SIZE.width}
                      height={THUMBNAIL_SIZE.height}
                      fit="cover"
                    />
                  </button>
                )}
              </For>
            </div>
            <div>
              <span>{format(t().pages.news.score, { n: a().score })}</span>
              {' · '}
              <span>{format(t().pages.news.by, { user: a().by })}</span>
              {' · '}
              <span>{format(t().pages.news.comments, { n: a().descendants ?? 0 })}</span>
            </div>
            <A href="../">{t().pages.article.backToNews}</A>
            <Lightbox
              items={coverItems}
              activeIndex={activeIndex()}
              onClose={() => setActiveIndex(null)}
              onNavigate={setActiveIndex}
              getTriggerElement={(id) => coverTriggers.get(id)}
              renderItem={(item) => (
                <Image
                  src={item().data.src}
                  alt={t().pages.article.imageAlt}
                  width={FULL_SIZE.width}
                  height={FULL_SIZE.height}
                  fit="cover"
                />
              )}
            />
          </div>
        );
      }}
    </DataBoundary>
  );
};

export default ArticlePage;
