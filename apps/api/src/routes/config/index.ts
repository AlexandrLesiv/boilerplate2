import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { clientConfigRoute, ok } from '@repo/shared';

import type { ClientConfigSource } from '../../common/client-config.js';

export const clientConfigRoutes =
  (source: ClientConfigSource): FastifyPluginAsyncTypebox =>
  async (fastify) => {
    fastify.get(clientConfigRoute.url, { schema: clientConfigRoute.schema }, async () => ok(source.current()));
  };
