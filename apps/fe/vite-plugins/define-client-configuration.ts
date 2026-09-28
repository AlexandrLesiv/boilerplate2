import type { Plugin } from 'vite';

// Relative path required: Vite externalises workspace packages when bundling this config, and
// Node then cannot resolve their internal `.js` specifiers against `.ts` sources.
import type { ClientConfigInput } from '../../../packages/shared/src/entities/client-config.ts';
import { resolveClientConfig } from '../../../packages/shared/src/node/client-config.ts';

/**
 * Resolves the build-time client configuration against the schema and bakes it in as
 * `__CLIENT_CONFIG_DEFAULTS__`, failing the build if it does not validate. Build time because
 * the browser cannot validate — see `.claude/agents/feature-flags.md`.
 */
export const defineClientConfiguration = (configuration: ClientConfigInput = {}): Plugin => ({
  name: 'define-client-configuration',
  enforce: 'pre',
  config() {
    const result = resolveClientConfig(configuration);
    if (!result.ok) {
      throw new Error(
        `[define-client-configuration] invalid client configuration:\n  ${result.errors.join('\n  ')}\n\n` +
          'Values must satisfy ClientConfigEntity in packages/shared/src/entities/client-config.ts.\n' +
          'Every leaf needs a `default` and every group needs `default: {}`.'
      );
    }
    return { define: { __CLIENT_CONFIG_DEFAULTS__: JSON.stringify(result.config) } };
  },
});
