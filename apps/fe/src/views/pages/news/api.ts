import { topStoriesRoute } from '@repo/shared';

import { createApiCall } from '../../../common/libs/api';

export const getTopStories = createApiCall(topStoriesRoute);
