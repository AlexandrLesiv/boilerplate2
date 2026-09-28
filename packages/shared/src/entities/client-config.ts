import { Type } from '@sinclair/typebox';

import { defineEntity, type InferEntity } from '../common/entity.js';

/**
 * Served by `GET /config/client`. Every leaf needs a `default`, and every group needs
 * `default: {}` — `Value.Default` skips objects that do not already exist.
 */
export const ClientConfigEntity = defineEntity('ClientConfig', {
  features: Type.Object(
    {
      localeSwitcher: Type.Boolean({ default: true }),
    },
    { default: {}, description: 'Runtime feature flags.' }
  ),
});

export type ClientConfig = InferEntity<typeof ClientConfigEntity>;

export type FeatureFlag = keyof ClientConfig['features'];

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Build-time input: anything omitted falls back to the schema `default`. */
export type ClientConfigInput = DeepPartial<ClientConfig>;
