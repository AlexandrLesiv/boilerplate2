import { articleRoute, topStoriesRoute } from '@repo/shared';

import { createSafeApiCall } from '../../../common/libs/api';

// Failures come back as `{ ok: false, status }` for DataBoundary to render, not as rejections.
export const getTopStories = createSafeApiCall(topStoriesRoute);
export const getArticle = createSafeApiCall(articleRoute);
