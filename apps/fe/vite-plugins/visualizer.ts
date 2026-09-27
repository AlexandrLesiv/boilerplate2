import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';

export function clientVisualizerPlugin(): Plugin[] {
  return (['treemap', 'sunburst', 'network'] as const).map((template) => {
    const plugin = visualizer({ template, gzipSize: true, filename: `dist/.stats/${template}.html` });
    const originalGenerateBundle = plugin.generateBundle!;
    return {
      ...plugin,
      async generateBundle(
        this: Parameters<typeof originalGenerateBundle>[0] & { environment?: { name: string } },
        ...args: Parameters<typeof originalGenerateBundle>
      ) {
        if (this.environment?.name !== 'client') return;
        return originalGenerateBundle.apply(this, args);
      },
    } satisfies Plugin;
  });
}
