import type { Plugin } from 'vite';

export function versionedClientOutputPlugin(version: string): Plugin {
  return {
    name: 'versioned-client-output',
    enforce: 'post',
    configEnvironment(name) {
      if (name !== 'client') return;
      return {
        build: {
          rolldownOptions: {
            output: {
              entryFileNames: `${version}/assets/[name]-[hash].js`,
              chunkFileNames: `${version}/assets/[name]-[hash].js`,
              assetFileNames: `${version}/assets/[name]-[hash][extname]`,
            },
          },
        },
      };
    },
  };
}
