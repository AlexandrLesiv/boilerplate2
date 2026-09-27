import { query } from '@solidjs/router';

import { articleRoute, topStoriesRoute } from '@repo/shared';

import { createApiCall } from '../../../common/libs/api';
import { buildRouteUrl } from '../../../common/libs/fetch';

export const getTopStories = createApiCall(topStoriesRoute);

export const getArticle = query(async (id: number) => {
  const url = buildRouteUrl(articleRoute.url, { id });
  const response = await fetch(url);

  if (response.status === 404) return null;

  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  return response.json();
}, 'hackernews:article');
