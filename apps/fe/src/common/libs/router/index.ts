import type { Params, RouteDefinition } from '@solidjs/router';

import type { Translations } from '../i18n';

export type RouteMeta = {
  title: string;
  description?: string;
  robots?: string;
  canonical?: string;
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
