import colors from 'picocolors';
import type { Plugin, ResolvedConfig } from 'vite';

import { readFileSync, statSync } from 'node:fs';

/**
 * Builds src/sw.ts into dist/client/sw.js after the client environment build.
 *
 * Scoped to the client environment via the `closeBundle` environment check —
 * avoids the `configResolved`-per-env issue that breaks vite-plugin-pwa with
 * SolidStart's multi-environment build. Injects the versioned asset list from
 * the client manifest as the `__WB_MANIFEST` define token.
 */
export function serviceWorkerPlugin(): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'service-worker',
    apply: 'build',
    configResolved(resolved) {
      if (!resolved.build.ssr) config = resolved;
    },
    closeBundle: {
      order: 'post',
      async handler() {
        if (this.environment?.name !== 'client') return;

        const manifest = JSON.parse(readFileSync('dist/client/.vite/manifest.json', 'utf-8')) as Record<
          string,
          { file: string; css?: string[] }
        >;
        const assets = Object.values(manifest).flatMap(({ file, css = [] }) => [
          `/${file}`,
          ...css.map((c) => `/${c}`),
        ]);

        const { build } = await import('vite');
        await build({
          configFile: false,
          plugins: [],
          logLevel: 'silent',
          define: {
            __WB_MANIFEST: JSON.stringify(assets.map((url) => ({ url, revision: null }))),
          },
          build: {
            outDir: 'dist/client',
            emptyOutDir: false,
            rolldownOptions: {
              input: new URL('../src/sw.ts', import.meta.url).pathname,
              output: { format: 'es', entryFileNames: 'sw.js' },
            },
          },
        });

        const { size } = statSync('dist/client/sw.js');
        config.logger.info(
          `${colors.cyan('dist/client/sw.js')}  ${colors.dim(`${(size / 1024).toFixed(2)} kB`)}  ${colors.dim(`(${assets.length} assets precached)`)}\n`
        );
      },
    },
  };
}
