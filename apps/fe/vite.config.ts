import { solidStart } from '@solidjs/start/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Sonda from 'sonda/vite';
import { defineConfig, perEnvironmentPlugin } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

import pkg from './package.json';
import { defineClientConfiguration } from './vite-plugins/define-client-configuration.ts';
import { htmlValidatePlugin } from './vite-plugins/html-validate.ts';
import { serviceWorkerPlugin } from './vite-plugins/service-worker.ts';
import { stripTypeboxPlugin } from './vite-plugins/strip-typebox.ts';
import { validateEnvPlugin } from './vite-plugins/validate-env.ts';
import { versionedClientOutputPlugin } from './vite-plugins/versioned-client-output.ts';

/// <reference types="vitest/config" />
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export default defineConfig(async () => {
  const appVersion = pkg.version;
  const appName = pkg.name;
  // Sonda reads real source maps to size modules, unlike the plugin it replaced — so unlike that
  // one, it can't just sit in the plugins array unconditionally without shipping sourcemaps in
  // every production build. Opt in with `ANALYZE=true pnpm build`.
  const analyze = process.env['ANALYZE'] === 'true';

  let gitHash = 'unknown';
  try {
    const { stdout } = await execAsync('git rev-parse --short HEAD');
    gitHash = stdout.trim();
  } catch {
    // not a git repo, shallow clone, or git unavailable
  }

  return {
    plugins: [
      vanillaExtractPlugin(),
      ...solidStart({ ssr: true, middleware: './src/middleware.ts' }),
      htmlValidatePlugin(),
      serviceWorkerPlugin(),
      stripTypeboxPlugin(),
      validateEnvPlugin(),
      defineClientConfiguration({
        features: {
          localeSwitcher: true,
        },
      }),
      versionedClientOutputPlugin(appVersion),
      // Sonda's plain Vite integration has no client/server filter (that's framework-integration
      // only) — it runs on every environment's build pass. Scope it to `client` with Vite's own
      // environment API rather than the report-picking the caller would otherwise have to do.
      analyze &&
        perEnvironmentPlugin('sonda-client-only', (environment) =>
          environment.name === 'client' ? Sonda({ gzip: true }) : false
        ),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_NAME__: JSON.stringify(appName),
      __GIT_HASH__: JSON.stringify(gitHash),
    },
    build: {
      sourcemap: analyze,
    },
    css: {
      transformer: 'lightningcss',
    },
    resolve: {
      alias: { '@': '/src' },
    },
    server: {
      port: 3000,
    },
    test: {
      projects: [
        {
          extends: true,
          plugins: [storybookTest({ configDir: new URL('.storybook', import.meta.url).pathname })],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  } as const;
});
