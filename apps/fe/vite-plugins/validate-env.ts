import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import type { Plugin } from 'vite';

// Add every VITE_* variable here and to .env.example when introducing a new one.
const EnvSchema = Type.Object({
  VITE_APP_BASE_URL: Type.String({ minLength: 1 }),
  VITE_APP_API_URL: Type.String({ minLength: 1 }),
});

export function validateEnvPlugin(): Plugin {
  return {
    name: 'validate-env',
    enforce: 'pre',
    configResolved(config) {
      if (!Value.Check(EnvSchema, config.env)) {
        const lines = [...Value.Errors(EnvSchema, config.env)].map(
          (e) => `  ${e.path.replace(/^\//, '') || 'unknown'}: ${e.message}`
        );
        throw new Error(
          `[validate-env] Missing or invalid environment variables:\n${lines.join('\n')}\n\nSee apps/fe/.env.example for required variables.`
        );
      }
    },
  };
}
