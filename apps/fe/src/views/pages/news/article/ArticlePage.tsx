import type { Component } from 'solid-js';
import { Show } from 'solid-js';

import { Title } from '@solidjs/meta';
import { A, createAsync, useParams } from '@solidjs/router';

import { format, useI18n } from '../../../../common/libs/i18n';
import { DataBoundary } from '../../../components/DataBoundary/DataBoundary';
import { getArticle } from '../api';

const ArticlePage: Component = () => {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const article = createAsync(() => getArticle({ params: { id: Number(params.id) } }));

  return (
    <DataBoundary result={article()}>
      {({ data: a }) => (
        <div>
          <Title>{a.title}</Title>
          <h1>
            <Show when={a.url} fallback={a.title}>
              <a href={a.url} target="_blank" rel="noopener noreferrer">
                {a.title}
              </a>
            </Show>
          </h1>
          <div>
            <span>{format(t().pages.news.score, { n: a.score })}</span>
            {' · '}
            <span>{format(t().pages.news.by, { user: a.by })}</span>
            {' · '}
            <span>{format(t().pages.news.comments, { n: a.descendants ?? 0 })}</span>
          </div>
          <A href="../">{t().pages.article.backToNews}</A>
        </div>
      )}
    </DataBoundary>
  );
};

export default ArticlePage;
