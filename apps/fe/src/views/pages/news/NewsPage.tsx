import type { Component } from 'solid-js';
import { ErrorBoundary, For, Suspense } from 'solid-js';

import { createAsync } from '@solidjs/router';

import { format, useI18n } from '../../../common/libs/i18n';
import { body, errorBox, item, list, meta, rank, titleLink } from './styles.css';
import { getTopStories } from './api';

const NewsPage: Component = () => {
  const { locale, t } = useI18n();
  const response = createAsync(() => getTopStories(locale()));
  const stories = () => response()?.data ?? [];

  const hnItemUrl = (id: number) => `https://news.ycombinator.com/item?id=${id}`;

  return (
    <div>
      <h1>{t().pages.news.title}</h1>
      <ErrorBoundary fallback={(err) => <p class={errorBox}>{String(err)}</p>}>
        <Suspense fallback={<p>{t().pages.news.loading}</p>}>
          <ol class={list}>
            <For each={stories()}>
              {(story, i) => (
                <li class={item}>
                  <span class={rank}>{i() + 1}.</span>
                  <div class={body}>
                    <a
                      class={titleLink}
                      href={story.url ?? hnItemUrl(story.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {story.title}
                    </a>
                    <div class={meta}>
                      <span>{format(t().pages.news.score, { n: story.score })}</span>
                      <span>{format(t().pages.news.by, { user: story.by })}</span>
                      <a href={hnItemUrl(story.id)} target="_blank" rel="noopener noreferrer">
                        {format(t().pages.news.comments, { n: story.descendants ?? 0 })}
                      </a>
                    </div>
                  </div>
                </li>
              )}
            </For>
          </ol>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default NewsPage;
