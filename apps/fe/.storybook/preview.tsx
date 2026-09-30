import { query } from '@solidjs/router';

import { mswLoader } from 'msw-storybook-addon/csf3';
import type { Preview } from 'storybook-solidjs-vite';

import '@/assets/styles/global.css.ts';

import { installLayoutShiftStats, setLayoutShiftStatsOverlay } from './layout-shift-stats';
import { allHandlers } from './mocks/handlers';
import { setClientConfigOverrides } from './mocks/handlers/config';
import { installRenderStats, setRenderStatsOverlay } from './render-stats';

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
  /**
   * `query()` from @solidjs/router caches by `name + hashKey(args)` in a module-level
   * Map that outlives a story switch. Within PRELOAD_TIMEOUT (5s) a cached entry is
   * served without revalidating, so a story would render the *previous* story's data
   * and never hit its own MSW handler. Reset the cache so every story starts cold.
   */
  globalTypes: {
    renderStats: {
      description: 'Overlay counting reactive-owner creation and DOM churn',
      defaultValue: 'off',
      toolbar: {
        title: 'Renders',
        icon: 'lightning',
        items: [
          { value: 'off', title: 'Render stats: off' },
          { value: 'on', title: 'Render stats: on' },
        ],
        dynamicTitle: true,
      },
    },
    layoutShift: {
      description: 'Overlay scoring layout shifts (Layout Instability API) inside the story canvas',
      defaultValue: 'off',
      toolbar: {
        title: 'Layout shift',
        icon: 'move',
        items: [
          { value: 'off', title: 'Layout shift: off' },
          { value: 'on', title: 'Layout shift: on' },
        ],
        dynamicTitle: true,
      },
    },
  },
  beforeEach: (context) => {
    query.clear();
    // Also module-level state that outlives a story switch: without this a story that turns a flag
    // off leaves it off for the next one.
    setClientConfigOverrides({});
    // Counts component instantiations and DOM churn for this story — `renderStats()` in a play
    // function, or `__renderStats.get()` in the browser console.
    installRenderStats(context.canvasElement);
    // Off unless switched on from the toolbar, so stories, snapshots and the a11y tree are
    // untouched by default.
    setRenderStatsOverlay(context.globals['renderStats'] === 'on', context.id);
    // Scores layout shifts attributable to nodes inside this story's canvas — `layoutShiftStats()`
    // in a play function, or `__layoutShiftStats.get()` in the browser console.
    installLayoutShiftStats(context.canvasElement);
    setLayoutShiftStatsOverlay(context.globals['layoutShift'] === 'on', context.id);
  },
  parameters: {
    msw: {
      handlers: allHandlers,
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
      // `target-size` (WCAG 2.5.8, "touch targets must be 24px or leave sufficient space") ships
      // disabled by default in axe-core — verified against the installed package
      // (`axe._audit.rules.find(r => r.id === 'target-size').enabled === false`). Without this,
      // every existing `a11y: { test: 'error' }` story only ever checked the rules axe enables
      // by default, so an undersized target could ship clean through that gate. Enabling it here
      // makes it run for every story from now on, surfaced in the addon panel immediately; each
      // component still needs its own violations fixed and its story promoted to
      // `test: 'error'` before this actually blocks a regression, per the existing convention.
      options: { rules: { 'target-size': { enabled: true } } },
    },
  },
};

export default preview;
