import { Type } from '@sinclair/typebox';

import { defineResponse } from '../common/response.js';
import { defineSharedApiRoute } from '../common/route.js';

export const loginRoute = defineSharedApiRoute({
  url: '/api/auth/login',
  method: 'POST',
  schema: {
    tags: ['auth'],
    summary: 'Login with email and password',
    body: Type.Object({
      email: Type.String({ format: 'email' }),
      password: Type.String({ minLength: 1 }),
    }),
    response: {
      200: defineResponse(
        Type.Object({
          id: Type.String(),
          email: Type.String(),
        })
      ),
    },
  },
});
