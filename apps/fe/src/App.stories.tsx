import { Show } from 'solid-js';

import type { Meta, StoryObj } from 'storybook-solidjs-vite';

import { FullApp } from '../.storybook/decorators';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, localePath } from './common/libs/i18n';
import type { Locale } from './common/libs/i18n';
import { hackernewsStories } from './mocks/handlers/hackernews';

type AppArgs = {
  locale: Locale;
  page: string;
  localeSwitcher: boolean;
};

const PAGES = ['/', '/news', `/news/${hackernewsStories[0]!.id}`, '/login'];

/**
 * The real router and the real route tree, running entirely on MSW. Locale, page and feature
 * flags are controls, so one story covers every app-wide combination — page-specific
 * interactions belong in that page's own stories.
 */
const meta: Meta<AppArgs> = {
  title: 'App/Full Application',
  parameters: { layout: 'fullscreen' },
  argTypes: {
    locale: { control: 'radio', options: [...SUPPORTED_LOCALES], name: 'Locale' },
    page: { control: 'select', options: PAGES, name: 'Page' },
    localeSwitcher: { control: 'boolean', name: 'feature: localeSwitcher' },
  },
  args: {
    locale: DEFAULT_LOCALE,
    page: '/',
    localeSwitcher: true,
  },
  // Keyed Show, so every control change remounts the app: reading the args here also makes
  // Storybook's story memo track them.
  render: (args) => (
    <Show when={`${args.locale}|${args.page}|${String(args.localeSwitcher)}`} keyed={true}>
      {(_key: string) => (
        <FullApp path={localePath(args.page, args.locale)} features={{ localeSwitcher: args.localeSwitcher }} />
      )}
    </Show>
  ),
};

export default meta;
type Story = StoryObj<AppArgs>;

/** Drive locale, page and feature flags from the controls panel. */
export const Default: Story = {};
