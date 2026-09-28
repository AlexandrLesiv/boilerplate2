import { defineResponse } from '../common/response.js';
import { defineSharedApiRoute } from '../common/route.js';
import { ClientConfigEntity } from '../entities/client-config.js';

export const clientConfigRoute = defineSharedApiRoute({
  url: '/config/client',
  method: 'GET',
  schema: {
    tags: ['config'],
    summary: 'Get runtime client configuration',
    description:
      'Returns the runtime feature flags and settings the client should use. Values come from the ' +
      'file named by CLIENT_CONFIG_PATH, overlaid on the schema defaults.',
    response: {
      200: defineResponse(ClientConfigEntity),
    },
  },
});
