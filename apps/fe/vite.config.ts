import { solidStart } from '@solidjs/start/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';
import oxlint from 'vite-plugin-oxlint';

import { serviceWorkerPlugin } from './vite-plugins/service-worker.ts';
import { stripTypeboxPlugin } from './vite-plugins/strip-typebox.ts';
import { versionedClientOutputPlugin } from './vite-plugins/versioned-client-output.ts';
import { clientVisualizerPlugin } from './vite-plugins/visualizer.ts';

/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    ...solidStart({ ssr: true, middleware: './src/middleware.ts' }),
    oxlint(),
    serviceWorkerPlugin(),
    stripTypeboxPlugin(),
    versionedClientOutputPlugin(version),
    ...clientVisualizerPlugin(),
  ],
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
});
