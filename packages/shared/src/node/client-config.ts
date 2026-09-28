import { Value } from '@sinclair/typebox/value';

import { ClientConfigEntity, type ClientConfig } from '../entities/client-config.js';

/**
 * Node-only: keep out of `src/index.ts`, which the client bundle imports and where
 * `strip-typebox.ts` would leave `Value` undefined. See `.claude/agents/feature-flags.md`.
 */
export type ClientConfigResult = { ok: true; config: ClientConfig } | { ok: false; errors: string[] };

export const resolveClientConfig = (input: unknown): ClientConfigResult => {
  // Clean before Check: Check on its own accepts unknown properties.
  const candidate = Value.Clean(
    ClientConfigEntity,
    Value.Default(ClientConfigEntity, Value.Convert(ClientConfigEntity, input ?? {}))
  );

  if (!Value.Check(ClientConfigEntity, candidate)) {
    const errors = [...Value.Errors(ClientConfigEntity, candidate)].map(
      (error) => `${error.path.replace(/^\//, '') || 'unknown'}: ${error.message}`
    );
    return { ok: false, errors };
  }

  return { ok: true, config: candidate };
};

/** The schema's own defaults, validated. Throws if the schema itself is inconsistent. */
export const clientConfigDefaults = (): ClientConfig => {
  const result = resolveClientConfig({});
  if (!result.ok) {
    throw new Error(`client config schema defaults are invalid:\n  ${result.errors.join('\n  ')}`);
  }
  return result.config;
};
