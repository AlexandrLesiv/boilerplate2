import { faker } from '@faker-js/faker';
import { http, HttpResponse } from 'msw';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';

import { topStoriesRoute } from '@repo/shared';

import { withPageLayout } from '../../../../.storybook/decorators';
import NewsPage from './NewsPage';

const meta: Meta<typeof NewsPage> = {
  title: 'Pages/News',
  component: NewsPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withPageLayout()],
};

export default meta;
type Story = StoryObj<typeof NewsPage>;

// ─── helpers ─────────────────────────────────────────────────────────────────

function story(overrides: Partial<ReturnType<typeof baseStory>> = {}) {
  return { ...baseStory(), ...overrides };
}

function baseStory() {
  return {
    id: faker.number.int({ min: 1, max: 99_999_999 }),
    title: faker.lorem.sentence({ min: 5, max: 10 }),
    url: faker.internet.url(),
    by: faker.internet.username(),
    score: faker.number.int({ min: 1, max: 500 }),
    descendants: faker.number.int({ min: 0, max: 200 }),
    time: Math.floor(faker.date.recent({ days: 7 }).getTime() / 1000),
  };
}

function ok(data: ReturnType<typeof baseStory>[]) {
  return HttpResponse.json({ data, meta: { total: data.length, isOk: true } });
}

function handler(data: ReturnType<typeof baseStory>[]) {
  return http.get(`*${topStoriesRoute.url}`, () => ok(data));
}

// ─── happy path ──────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    msw: { handlers: [handler(Array.from({ length: 30 }, () => story()))] },
  },
};

// ─── loading / suspense ───────────────────────────────────────────────────────

/** Fetch never resolves — exercises the Suspense fallback. */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [http.get(`*${topStoriesRoute.url}`, () => new Promise(() => {}))],
    },
  },
};

// ─── empty ────────────────────────────────────────────────────────────────────

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [http.get(`*${topStoriesRoute.url}`, () => ok([]))],
    },
  },
};

// ─── server errors ────────────────────────────────────────────────────────────

export const ServerError500: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`*${topStoriesRoute.url}`, () =>
          HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
        ),
      ],
    },
  },
};

export const ServerError503: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`*${topStoriesRoute.url}`, () =>
          HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 }),
        ),
      ],
    },
  },
};

// ─── network errors ───────────────────────────────────────────────────────────

/** Simulates a dropped connection / offline — fetch rejects entirely. */
export const NetworkError: Story = {
  parameters: {
    msw: {
      handlers: [http.get(`*${topStoriesRoute.url}`, () => HttpResponse.error())],
    },
  },
};

/** No MSW handler — request passes through to the real API. */
export const RealNetwork: Story = {
  parameters: {
    msw: { handlers: [] },
  },
};

// ─── edge cases: text ────────────────────────────────────────────────────────

/** Title is a very long unbreakable string (URL-like). */
export const VeryLongTitle: Story = {
  parameters: {
    msw: {
      handlers: [
        handler([
          story({
            title:
              'https://this-is-an-extremely-long-url-that-has-no-spaces-and-will-break-layouts-if-not-handled.example.com/path/to/some/deeply/nested/resource?with=query&params=everywhere',
          }),
          story({ title: 'A'.repeat(200) }),
          ...Array.from({ length: 5 }, () => story()),
        ]),
      ],
    },
  },
};

export const VeryLongUsername: Story = {
  parameters: {
    msw: {
      handlers: [
        handler([
          story({ by: 'a'.repeat(80) }),
          story({ by: 'this_is_a_very_long_hacker_news_username_that_exceeds_normal_limits' }),
          ...Array.from({ length: 5 }, () => story()),
        ]),
      ],
    },
  },
};

// ─── edge cases: numbers ─────────────────────────────────────────────────────

export const ExtremeNumbers: Story = {
  parameters: {
    msw: {
      handlers: [
        handler([
          story({ score: 99_999, descendants: 9_999 }),
          story({ score: 0, descendants: 0 }),
          story({ score: -1, descendants: -5 }),
          story({ score: 1, descendants: 1 }),
          ...Array.from({ length: 5 }, () => story()),
        ]),
      ],
    },
  },
};

// ─── edge cases: URLs ────────────────────────────────────────────────────────

/** Mix of missing URL (falls back to HN link) and unusual schemes. */
export const UrlEdgeCases: Story = {
  parameters: {
    msw: {
      handlers: [
        handler([
          story({ url: undefined }),
          story({ url: 'https://localhost:3000/internal' }),
          story({ url: 'https://xn--n3h.ws/' }),
          story({ url: 'https://example.com/' + 'p/'.repeat(40) }),
          ...Array.from({ length: 5 }, () => story()),
        ]),
      ],
    },
  },
};

// ─── mixed extremes ───────────────────────────────────────────────────────────

/** One list that stacks every edge case for a comprehensive visual review. */
export const AllEdgeCases: Story = {
  parameters: {
    msw: {
      handlers: [
        handler([
          story({
            title:
              'https://no-spaces-very-long-url-title.example.com/path/nested/resource?a=1&b=2&c=3',
            score: 99_999,
            descendants: 9_999,
            by: 'username_with_many_characters_that_keeps_going',
          }),
          story({ url: undefined, score: 0, descendants: 0 }),
          story({ score: -1, descendants: -5 }),
          story({ title: 'A'.repeat(150), by: 'b'.repeat(60) }),
          ...Array.from({ length: 10 }, () => story()),
        ]),
      ],
    },
  },
};
