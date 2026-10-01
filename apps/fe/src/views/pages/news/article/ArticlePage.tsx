import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';

import { Title } from '@solidjs/meta';
import { A, createAsync, revalidate, useParams } from '@solidjs/router';

import { format, useI18n } from '@/common/libs/i18n';
import { Heading } from '@/views/components/Heading/Heading';
import { Image } from '@/views/components/Image/Image';
import { Lightbox } from '@/views/components/Lightbox/Lightbox';
import type { LightboxItem } from '@/views/components/Lightbox/Lightbox';
import { Text } from '@/views/components/Text/Text';
import { DataBoundary } from '@/views/containers/DataBoundary/DataBoundary';

import { getArticle } from '../api';
import { FULL_SIZE, THUMBNAIL_SIZE } from './constants';
import * as styles from './styles.css';

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
          <div class={styles.container}>
            <Title>{a().title}</Title>
            <Heading as="h1">
              <Show when={a().url} fallback={a().title}>
                <a href={a().url} target="_blank" rel="noopener noreferrer">
                  {a().title}
                </a>
              </Show>
            </Heading>
            {/* `content` is placeholder copy the API attaches server-side (StoryEntity.content) —
            real Hacker News items have no article body at all, so this is `Optional`. */}
            <div class={styles.body}>
              <For each={a().content ?? []}>{(paragraph) => <Text as="p">{paragraph}</Text>}</For>
            </div>
            <div class={styles.coverGallery}>
              <For each={coverItems}>
                {(item, index) => (
                  <button
                    type="button"
                    class={styles.coverTrigger}
                    ref={(el) => coverTriggers.set(item.id, el)}
                    onClick={() => setActiveIndex(index())}
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
