import type { Params, RouteDefinition } from '@solidjs/router';

import type { Translations } from '../i18n';
import type { JsonLdSchema } from '../seo/JsonLd';

export type { JsonLdSchema } from '../seo/JsonLd';
export { defineJsonLd } from '../seo/JsonLd';

export type RouteMeta = {
  title: string;
  description?: string;
  robots?: string;
  canonical?: string;
  schema?: JsonLdSchema | JsonLdSchema[];
};

export type AppRouteInfo<TData = undefined> = {
  load?: (params: Params) => Promise<TData> | TData;
  meta: (data: TData, t: Translations) => RouteMeta;
};

export function defineRoute<TData = undefined>(
  config: Omit<RouteDefinition, 'info' | 'children'> & {
    info?: AppRouteInfo<TData>;
    children?: RouteDefinition[];
  }
): RouteDefinition {
  return config as RouteDefinition;
}
