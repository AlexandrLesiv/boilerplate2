import type { Plugin } from 'vite';

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

// `@solidjs/start/dist/shared/dev-toolbar/index.jsx` isn't in the package's own `exports` map
// (only `./client`, `./server`, etc. are), so it can't be resolved by specifier directly — this
// walks there from an entry point that *is* exported, which stays correct across dependency
// upgrades instead of hardcoding pnpm's version-hashed store path.
const devToolbarPath = join(
  dirname(createRequire(import.meta.url).resolve('@solidjs/start/client')),
  '../shared/dev-toolbar/index.jsx'
);

// `devOverlay: false` (vite.config.ts's `solidStart(...)` call) only disables @solidjs/start's
// dev toolbar at *runtime* — its own `ErrorBoundary.jsx` has a static
// `import { DevToolbar } from './dev-toolbar/index.jsx'`, so tree-shaking drops the dead *usage*
// but not the *module*, including its `shared/ui/*.css` imports (Badge, Button, IconButton,
// Section, Select, Tabs, Text). Confirmed live: that was ~16KB of `[data-start-*]` rules — about
// half the production CSS bundle — despite zero trace of the toolbar's own JS reaching the built
// output. `apply: 'build'` keeps the real module for `vp dev`, in case `devOverlay` ever gets
// flipped back on locally.
export function stripDevToolbarPlugin(): Plugin {
  return {
    name: 'strip-dev-toolbar',
    apply: 'build',
    load(id) {
      if (id === devToolbarPath) {
        return 'export const DevToolbar = (props) => props.children;';
      }
    },
  };
}
