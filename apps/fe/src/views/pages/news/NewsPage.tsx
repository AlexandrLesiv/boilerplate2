import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { Meta, Title } from '@solidjs/meta';
import { A, createAsync, revalidate, useParams } from '@solidjs/router';

import { format, localePath, localeFromParams, useI18n } from '@/common/libs/i18n';
import { defineJsonLd, JsonLd } from '@/common/libs/seo/JsonLd';
import { Breadcrumbs, defineBreadcrumbListSchema } from '@/views/components/Breadcrumbs/Breadcrumbs';
import { Heading } from '@/views/components/Heading/Heading';
import { Link } from '@/views/components/Link/Link';
import { Text } from '@/views/components/Text/Text';
import { DataBoundary } from '@/views/containers/ErrorBoundaries/DataBoundary';

import { getTopStories } from './api';
import * as styles from './styles.css';

const NewsPage: Component = () => {
  const { t } = useI18n();
  const params = useParams<{ locale?: string }>();
  const locale = () => localeFromParams(params);
  const response = createAsync(() => getTopStories());

  const hnItemUrl = (id: number) => `https://news.ycombinator.com/item?id=${id}`;

  const breadcrumbItems = () => [
    { label: t().nav.home, href: localePath('/', locale()) },
    { label: t().nav.news, href: localePath('/news', locale()) },
  ];

  // One reactive element, not a generic one plus a data-driven override — `@solidjs/meta` only
  // dedupes repeated `<meta>` tags when every tracked prop (including `content`) matches, so two
  // differently-worded description tags don't collapse into one and both end up in the document;
  // confirmed live in the built SSR output (see ArticlePage.tsx, which hit the same bug first).
  const description = () => {
    const result = response();
    return result?.ok
      ? format(t().pages.news.descriptionWithCount, { total: result.data.meta.total })
      : t().pages.news.description;
  };

  return (
    <div>
      <Title>{t().pages.news.title}</Title>
      <Meta name="description" content={description()} />
      <JsonLd
        schema={defineJsonLd({ '@type': 'CollectionPage', name: t().pages.news.title, description: description() })}
      />
      <JsonLd schema={defineBreadcrumbListSchema(breadcrumbItems())} />
      <Breadcrumbs items={breadcrumbItems()} class={styles.breadcrumbs} />
      <Heading as="h1">{t().pages.news.title}</Heading>
      <DataBoundary
        result={response()}
        // pending={<p>{t().pages.news.loading}</p>}
        onRetry={() => revalidate(getTopStories.key)}
      >
        {(page) => (
          <ol class={styles.list}>
            <For each={page().data}>
              {(story, i) => (
                <li class={styles.item}>
                  <Text as="span" variant="secondary" size="small" class={styles.rank}>
                    {i() + 1}.
                  </Text>
                  <div class={styles.body}>
                    <A class={styles.titleLink} href={String(story.id)}>
                      {story.title}
                    </A>
                    <div class={styles.meta}>
                      <span>{format(t().pages.news.score, { n: story.score })}</span>
                      <span>{format(t().pages.news.by, { user: story.by })}</span>
                      <Link href={hnItemUrl(story.id)} target="_blank" rel="noopener noreferrer" external>
                        {format(t().pages.news.comments, { n: story.descendants ?? 0 })}
                      </Link>
                    </div>
                  </div>
                </li>
              )}
            </For>
          </ol>
        )}
      </DataBoundary>
    </div>
  );
};

export default NewsPage;
