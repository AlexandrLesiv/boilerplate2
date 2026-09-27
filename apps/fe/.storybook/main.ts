import type { StorybookConfig } from 'storybook-solidjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    'msw-storybook-addon',
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    'storybook/viewport',
  ],
  framework: 'storybook-solidjs-vite',
  async viteFinal(config) {
    const { vanillaExtractPlugin } = await import('@vanilla-extract/vite-plugin');
    config.plugins = config.plugins ?? [];
    config.plugins.push(vanillaExtractPlugin());
    return config;
  },
};
export default config;
