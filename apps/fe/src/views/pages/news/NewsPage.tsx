import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { createAsync } from '@solidjs/router';
import { A } from '@solidjs/router';

import { format, useI18n } from '../../../common/libs/i18n';
import { DataBoundary } from '../../components/DataBoundary/DataBoundary';
import { getTopStories } from './api';
import * as styles from './styles.css';

const NewsPage: Component = () => {
  const { t } = useI18n();
  const response = createAsync(() => getTopStories());

  const hnItemUrl = (id: number) => `https://news.ycombinator.com/item?id=${id}`;

  return (
    <div>
      <h1>{t().pages.news.title}</h1>
      <DataBoundary result={response()} pending={<p>{t().pages.news.loading}</p>}>
        {(page) => (
          <ol class={styles.list}>
            <For each={page().data}>
              {(story, i) => (
                <li class={styles.item}>
                  <span class={styles.rank}>{i() + 1}.</span>
                  <div class={styles.body}>
                    <A class={styles.titleLink} href={String(story.id)}>
                      {story.title}
                    </A>
                    <div class={styles.meta}>
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
        )}
      </DataBoundary>
    </div>
  );
};

export default NewsPage;
