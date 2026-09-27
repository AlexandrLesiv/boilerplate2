export { defineEntity, defineListResponse, defineResponse, type InferEntity, ok, okList, type RouteSchema } from '@repo/shared';

import type { RouteSchema } from '@repo/shared';

export function defineSchema<T extends RouteSchema>(schema: T): T {
  return schema;
}
