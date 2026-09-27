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
});

export type Story = InferEntity<typeof StoryEntity>;
