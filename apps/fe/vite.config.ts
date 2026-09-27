import { solidStart } from '@solidjs/start/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { playwright } from '@vitest/browser-playwright';
import devtools from 'solid-devtools/vite';
import { defineConfig } from 'vite';
import oxlint from 'vite-plugin-oxlint';

import { htmlValidatePlugin } from './vite-plugins/html-validate.ts';
import { serviceWorkerPlugin } from './vite-plugins/service-worker.ts';
import { stripTypeboxPlugin } from './vite-plugins/strip-typebox.ts';
import { validateEnvPlugin } from './vite-plugins/validate-env.ts';
import { versionedClientOutputPlugin } from './vite-plugins/versioned-client-output.ts';
import { clientVisualizerPlugin } from './vite-plugins/visualizer.ts';

/// <reference types="vitest/config" />
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export default defineConfig(async () => {
  const appVersion = process.env['npm_package_version'] ?? 'unknown';
  const appName = process.env['npm_package_name'] ?? 'app';

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
      devtools({ autoname: true }),
      ...solidStart({ ssr: true, middleware: './src/middleware.ts' }),
      oxlint(),
      htmlValidatePlugin(),
      serviceWorkerPlugin(),
      stripTypeboxPlugin(),
      validateEnvPlugin(),
      versionedClientOutputPlugin(appVersion),
      ...clientVisualizerPlugin(),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_NAME__: JSON.stringify(appName),
      __GIT_HASH__: JSON.stringify(gitHash),
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
