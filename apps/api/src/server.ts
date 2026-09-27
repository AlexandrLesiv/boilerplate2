import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastify from 'fastify';

import { env } from './common/env.js';
import { hackerNewsRoutes } from './routes/hackernews/index.js';

const app = fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

await app.register(cors, { origin: true });

await app.register(swagger, {
  openapi: {
    info: { title: 'API', version: '0.0.1' },
  },
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
});

await app.register(hackerNewsRoutes);

const port = env.PORT;
await app.listen({ port, host: '0.0.0.0' });
