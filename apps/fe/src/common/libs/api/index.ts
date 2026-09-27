import type { RouteSchema, SharedApiRoute } from '@repo/shared';

import { useApi } from '../fetch';

export { createApi, useApi, ApiContext } from '../fetch';
export type { Api, ApiConfig } from '../fetch';

export const createApiCall = <S extends RouteSchema>(route: SharedApiRoute<S>) => {
  const api = useApi();
  return api.call(route);
};
