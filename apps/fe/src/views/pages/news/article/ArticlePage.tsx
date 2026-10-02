import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';

import { Title } from '@solidjs/meta';
import { createAsync, revalidate, useParams } from '@solidjs/router';

import { format, localePath, localeFromParams, useI18n } from '@/common/libs/i18n';
import { JsonLd } from '@/common/libs/seo/JsonLd';
import { Breadcrumbs, defineBreadcrumbListSchema } from '@/views/components/Breadcrumbs/Breadcrumbs';
import { Heading } from '@/views/components/Heading/Heading';
import { Image } from '@/views/components/Image/Image';
import { Lightbox } from '@/views/components/Lightbox/Lightbox';
import type { LightboxItem } from '@/views/components/Lightbox/Lightbox';
import { Link } from '@/views/components/Link/Link';
import { Text } from '@/views/components/Text/Text';
import { DataBoundary } from '@/views/containers/ErrorBoundaries/DataBoundary';

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
  const params = useParams<{ id: string; locale?: string }>();
  const { t } = useI18n();
  const locale = () => localeFromParams(params);
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
        const breadcrumbItems = () => [
          { label: t().nav.home, href: localePath('/', locale()) },
          { label: t().nav.news, href: localePath('/news', locale()) },
          { label: a().title, href: localePath(`/news/${params.id}`, locale()) },
        ];
        return (
          <div class={styles.container}>
            <Title>{a().title}</Title>
            <JsonLd schema={defineBreadcrumbListSchema(breadcrumbItems())} />
            <Breadcrumbs items={breadcrumbItems()} class={styles.breadcrumbs} />
            <Heading as="h1">
              <Show when={a().url} fallback={a().title}>
                <Link href={a().url} target="_blank" rel="noopener noreferrer" external>
                  {a().title}
                </Link>
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
