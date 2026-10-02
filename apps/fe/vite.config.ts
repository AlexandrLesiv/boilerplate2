import { solidStart } from '@solidjs/start/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Sonda from 'sonda/vite';
import { defineConfig, loadEnv, perEnvironmentPlugin } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

import pkg from './package.json';
import { defineClientConfiguration } from './vite-plugins/define-client-configuration.ts';
import { htmlValidatePlugin } from './vite-plugins/html-validate.ts';
import { serviceWorkerPlugin } from './vite-plugins/service-worker.ts';
import { stripDevToolbarPlugin } from './vite-plugins/strip-dev-toolbar.ts';
import { stripTypeboxPlugin } from './vite-plugins/strip-typebox.ts';
import { validateEnvPlugin } from './vite-plugins/validate-env.ts';
import { versionedClientOutputPlugin } from './vite-plugins/versioned-client-output.ts';

/// <reference types="vitest/config" />
import { exec } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// `pnpm --filter fe setup:https` (scripts/setup-https.sh) generates these via mkcert, covering
// localhost plus this machine's LAN address/hostname — without this, secure-context-only APIs
// (`crypto.randomUUID()`, etc.) silently don't exist when the dev server is opened from a real
// phone over a plain `http://<lan-ip>` URL, which isn't a secure context in any mobile browser.
// Falls back to `undefined` (plain HTTP) when the certs haven't been generated, so `vp dev` still
// works for anyone who hasn't run the setup script — e.g. CI, or a contributor not testing mobile.
const readDevHttpsCerts = async (): Promise<{ cert: Buffer; key: Buffer } | undefined> => {
  try {
    const certDir = new URL('./.certs/', import.meta.url);
    const [cert, key] = await Promise.all([
      readFile(new URL('dev-cert.pem', certDir)),
      readFile(new URL('dev-key.pem', certDir)),
    ]);
    return { cert, key };
  } catch {
    return undefined;
  }
};

export default defineConfig(async ({ mode }) => {
  const appVersion = pkg.version;
  const appName = pkg.name;
  const env = loadEnv(mode, process.cwd());
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

  // Vitest reuses this same config for its own internal browser server (the `storybook` project
  // below) — `process.env.VITEST` is how Vitest itself signals that. Serving *that* server over
  // HTTPS with an untrusted mkcert cert broke every story test: the headless browser's own
  // `ServiceWorkerSource` refused to fetch `mockServiceWorker.js` over it ("SSL certificate error"),
  // which fails MSW setup before a single story even renders. HTTPS/the API proxy only matter for
  // a human opening `vp dev` from a real phone — neither is needed, or safe, for a test run.
  const isVitest = !!process.env['VITEST'];
  const https = isVitest ? undefined : await readDevHttpsCerts();

  return {
    plugins: [
      vanillaExtractPlugin(),
      ...solidStart({ ssr: true, devOverlay: false, middleware: './src/middleware.ts' }),
      htmlValidatePlugin(),
      serviceWorkerPlugin(),
      stripDevToolbarPlugin(),
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
      https,
      proxy: isVitest
        ? undefined
        : {
            // Lets the browser reach the API through this same (HTTPS, LAN-reachable) origin
            // instead of the client bundle needing a second, separately-reachable absolute URL —
            // see `apiBaseUrl` in `common/constants/environment.ts`. Target is the same
            // `VITE_APP_API_URL` SSR already talks to directly (`.env`), not a second hardcoded
            // value that could silently drift from it.
            '/api': {
              target: env['VITE_APP_API_URL'],
              changeOrigin: true,
              rewrite: (path: string) => path.replace(/^\/api/, ''),
            },
          },
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
