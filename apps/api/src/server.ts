
import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from 'process';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

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

const port = Number(env.PORT ?? 4000);
await app.listen({ port, host: '0.0.0.0' }).then((r) => {
  console.log(`Listening at: ${r}`)
});
