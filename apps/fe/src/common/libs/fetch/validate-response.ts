import { FormatRegistry, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

// TypeBox ships no format validators, and an unregistered `format` makes Check fail with
// "Unknown format" — which would report every schema using one as a divergence. Register each
// format used in `packages/shared/src` here.
const isUri = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

FormatRegistry.Set('uri', isUri);
FormatRegistry.Set('email', (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));

/** Empty when the payload matches. Paths and messages only — values may hold PII. */
export const checkResponse = (schema: TSchema, payload: unknown): string[] => {
  if (Value.Check(schema, payload)) return [];
  return [...Value.Errors(schema, payload)].slice(0, 10).map((error) => `${error.path || '/'}: ${error.message}`);
};
