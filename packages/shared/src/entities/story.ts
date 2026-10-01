import { Type } from '@sinclair/typebox';

import { defineEntity, type InferEntity } from '../common/entity.js';

export const StoryEntity = defineEntity('Story', {
  id: Type.Number(),
  title: Type.String(),
  url: Type.Optional(Type.String({ format: 'uri' })),
  by: Type.String(),
  score: Type.Number(),
  descendants: Type.Number(),
  time: Type.Number(),
  // The real Hacker News API has no article body at all — only the single-article endpoint
  // populates this (with placeholder copy; HN items genuinely don't have one), so it's `Optional`
  // rather than carried, empty, on every item in the top-stories list too.
  content: Type.Optional(Type.Array(Type.String())),
});

export type Story = InferEntity<typeof StoryEntity>;
