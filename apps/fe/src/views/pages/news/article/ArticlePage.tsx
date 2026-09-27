import type { Component } from 'solid-js';
import { Show, Suspense } from 'solid-js';

import { Title } from '@solidjs/meta';
import { A, createAsync, useParams } from '@solidjs/router';

import { format, useI18n } from '../../../../common/libs/i18n';
import { getArticle } from '../api';

const ArticlePage: Component = () => {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const article = createAsync(async () => {
    const res = await getArticle(Number(params.id));
    if (res === null && import.meta.env.SSR) {
      const { setResponseStatus } = await import('@solidjs/start/http');
      setResponseStatus(404);
    }
    return res?.data ?? null;
  });

  return (
    <Suspense>
      <Show
        when={article()}
        fallback={
          <div>
            <h1>{t().pages.article.notFound}</h1>
            <p>{t().pages.article.notFoundDescription}</p>
            <A href="../">{t().pages.article.backToNews}</A>
          </div>
        }
      >
        {(a) => (
          <div>
            <Title>{a().title}</Title>
            <h1>
              <Show when={a().url} fallback={a().title}>
                <a href={a().url} target="_blank" rel="noopener noreferrer">
                  {a().title}
                </a>
              </Show>
            </h1>
            <div>
              <span>{format(t().pages.news.score, { n: a().score })}</span>
              {' · '}
              <span>{format(t().pages.news.by, { user: a().by })}</span>
              {' · '}
              <span>{format(t().pages.news.comments, { n: a().descendants ?? 0 })}</span>
            </div>
            <A href="../">{t().pages.article.backToNews}</A>
          </div>
        )}
      </Show>
    </Suspense>
  );
};

export default ArticlePage;
