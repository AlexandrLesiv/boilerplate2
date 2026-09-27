import type { Plugin } from 'vite';

export function stripTypeboxPlugin(): Plugin {
  return {
    name: 'strip-typebox',
    apply: 'build',
    load(id) {
      if (this.environment?.name !== 'client') return;
      if (id.includes('@sinclair/typebox')) {
        return `export const Type = new Proxy(() => Type, { get: () => Type })`;
      }
    },
  };
}
