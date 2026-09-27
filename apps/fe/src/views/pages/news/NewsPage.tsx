import type { Component } from 'solid-js';
import { ErrorBoundary, For, Suspense, createResource } from 'solid-js';

import { topStoriesRoute } from '@repo/shared';

import { createApiCall } from '../../../common/libs/api';
import { useI18n } from '../../../common/libs/i18n';

const fetchTopStories = createApiCall(topStoriesRoute);
import { body, errorBox, item, list, meta, rank, titleLink } from './styles.css';

const NewsPage: Component = () => {
  const { t } = useI18n();
  const [response] = createResource(() => fetchTopStories());
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
                      <span>{t().pages.news.score(story.score)}</span>
                      <span>{t().pages.news.by(story.by)}</span>
                      <a href={hnItemUrl(story.id)} target="_blank" rel="noopener noreferrer">
                        {t().pages.news.comments(story.descendants ?? 0)}
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
