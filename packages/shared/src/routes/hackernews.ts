import { Type } from '@sinclair/typebox';

import { defineListResponse } from '../common/response.js';
import { defineSharedApiRoute } from '../common/route.js';
import { StoryEntity } from '../entities/story.js';

export const topStoriesRoute = defineSharedApiRoute({
  url: '/hackernews/top',
  method: 'GET',
  schema: {
    tags: ['hackernews'],
    summary: 'Get top Hacker News stories',
    querystring: Type.Object({
      limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 30 })),
    }),
    response: {
      200: defineListResponse(StoryEntity),
    },
  },
});
