import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

// Add every variable here and to apps/api/.env.example when introducing a new one.
const EnvSchema = Type.Object({
  PORT: Type.Number({ minimum: 1, maximum: 65535, default: 4000 }),
});

// `process.env` is a host object whose prototype is not `Object.prototype`, so TypeBox
// does not treat it as an object and skips conversion entirely — spread it into a plain
// object first, otherwise `PORT` stays the string Node handed us.
const raw = Value.Default(EnvSchema, Value.Convert(EnvSchema, { ...process.env }));

if (!Value.Check(EnvSchema, raw)) {
  for (const error of Value.Errors(EnvSchema, raw)) {
    console.error(`[env] ${error.path.replace(/^\//, '') || 'unknown'}: ${error.message}`);
  }
  console.error('See apps/api/.env.example for required variables.');
  process.exit(1);
}

export const env = raw;
