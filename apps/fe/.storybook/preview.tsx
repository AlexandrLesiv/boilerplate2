import type { Preview } from 'storybook-solidjs-vite';
import { mswLoader } from 'msw-storybook-addon/csf3';

import '../src/assets/styles/global.css.ts';
import { hackernewsHandlers } from '../src/mocks/handlers/hackernews';

const BREAKPOINTS = {
  mobile: {
    name: 'Mobile — 390px',
    styles: { width: '390px', height: '844px' },
    type: 'mobile' as const,
  },
  mobileLandscape: {
    name: 'Mobile — 390px (landscape)',
    styles: { width: '844px', height: '390px' },
    type: 'mobile' as const,
  },
  mobileLarge: {
    name: 'Mobile L — 430px',
    styles: { width: '430px', height: '932px' },
    type: 'mobile' as const,
  },
  mobileLargeLandscape: {
    name: 'Mobile L — 430px (landscape)',
    styles: { width: '932px', height: '430px' },
    type: 'mobile' as const,
  },
  tablet: {
    name: 'Tablet — 768px',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet' as const,
  },
  tabletLandscape: {
    name: 'Tablet — 768px (landscape)',
    styles: { width: '1024px', height: '768px' },
    type: 'tablet' as const,
  },
  laptop: {
    name: 'Laptop — 1280px',
    styles: { width: '1280px', height: '800px' },
    type: 'desktop' as const,
  },
  wide: {
    name: 'Wide — 1440px',
    styles: { width: '1440px', height: '900px' },
    type: 'desktop' as const,
  },
  tv: {
    name: 'TV — 1920px',
    styles: { width: '1920px', height: '1080px' },
    type: 'desktop' as const,
  },
  tv4k: {
    name: 'TV 4K — 3840px',
    styles: { width: '3840px', height: '2160px' },
    type: 'desktop' as const,
  },
};

const preview: Preview = {
  loaders: [mswLoader()],
  parameters: {
    msw: {
      handlers: hackernewsHandlers,
    },
    viewport: {
      options: BREAKPOINTS,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
