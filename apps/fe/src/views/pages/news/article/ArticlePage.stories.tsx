import { faker } from '@faker-js/faker';
import { articleRoute, type Story as Article } from '@repo/shared';
import type { HttpResponseResolver } from 'msw';
import { http, HttpResponse } from 'msw';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';

import { withPageLayout } from '../../../../../.storybook/decorators';
import ArticlePage from './ArticlePage';

const meta: Meta<typeof ArticlePage> = {
  title: 'Pages/Article',
  component: ArticlePage,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof ArticlePage>;

// ─── helpers ─────────────────────────────────────────────────────────────────

const ARTICLE_URL = `*${articleRoute.url}`;

const baseArticle = (id: number): Article => ({
  id,
  title: faker.lorem.sentence({ min: 5, max: 10 }),
  url: faker.internet.url(),
  by: faker.internet.username(),
  score: faker.number.int({ min: 1, max: 500 }),
  descendants: faker.number.int({ min: 0, max: 200 }),
  time: Math.floor(faker.date.recent({ days: 7 }).getTime() / 1000),
});

const ok = (data: Article) => HttpResponse.json({ data });

/**
 * `getArticle` is a `query()` keyed on the article id. `.storybook/preview.tsx` clears
 * the router query cache before each story, so distinct ids are no longer load-bearing
 * — they are kept so each story stays independent of cache state on its own.
 */
const articleStory = (id: number, resolver: HttpResponseResolver): Story => ({
  decorators: [withPageLayout({ path: '/news/:id', initialPath: `/news/${id}` })],
  parameters: { msw: { handlers: [http.get(ARTICLE_URL, resolver)] } },
});

const withArticle = (id: number, overrides: Partial<Article> = {}): Story =>
  articleStory(id, () => ok({ ...baseArticle(id), ...overrides }));

// ─── happy path ──────────────────────────────────────────────────────────────

export const Default: Story = withArticle(101);

// ─── loading / suspense ──────────────────────────────────────────────────────

/** Fetch never resolves — exercises the Suspense fallback. */
export const Loading: Story = articleStory(102, () => new Promise(() => {}));

// ─── not found ───────────────────────────────────────────────────────────────

/** 404 is mapped to `null`, which renders the "article not found" fallback. */
export const NotFound: Story = articleStory(103, () =>
  HttpResponse.json({ message: 'Story not found' }, { status: 404 })
);

// ─── server errors ───────────────────────────────────────────────────────────

/** `getArticle` throws on any non-404 error — there is no ErrorBoundary above this page. */
export const ServerError500: Story = articleStory(104, () =>
  HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
);

export const ServerError503: Story = articleStory(105, () =>
  HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 })
);

// ─── network errors ──────────────────────────────────────────────────────────

/** Simulates a dropped connection / offline — fetch rejects entirely. */
export const NetworkError: Story = articleStory(106, () => HttpResponse.error());

/** No MSW handler — request passes through to the real API. */
export const RealNetwork: Story = {
  decorators: [withPageLayout({ path: '/news/:id', initialPath: '/news/8863' })],
  parameters: { msw: { handlers: [] } },
};

// ─── edge cases: URLs ────────────────────────────────────────────────────────

/** No `url` — the heading renders as plain text instead of an outbound link. */
export const NoUrl: Story = withArticle(107, { url: undefined });

export const UnusualUrl: Story = withArticle(108, { url: `https://example.com/${'p/'.repeat(40)}` });

/** Punycode/IDN host — checks the link text is not mangled. */
export const PunycodeUrl: Story = withArticle(109, { url: 'https://xn--n3h.ws/' });

// ─── edge cases: text ────────────────────────────────────────────────────────

/** Unbreakable URL-like title plus a long run of characters, as the heading link. */
export const VeryLongTitle: Story = withArticle(110, {
  title:
    'https://this-is-an-extremely-long-url-that-has-no-spaces-and-will-break-layouts-if-not-handled.example.com/path/to/some/deeply/nested/resource?with=query&params=everywhere',
});

export const VeryLongUsername: Story = withArticle(111, { by: 'a'.repeat(80) });

/** Confirms the title is escaped rather than rendered as markup. */
export const XssAttemptTitle: Story = withArticle(112, {
  title: '<script>alert(1)</script><img src=x onerror=alert(2)>',
});

export const UnicodeTitle: Story = withArticle(113, {
  title: 'Émojis, ümlauts and 日本語 in a headline 🎉 — mixed scripts',
  by: 'müller_日本',
});

// ─── edge cases: numbers ─────────────────────────────────────────────────────

export const ExtremeNumbers: Story = withArticle(114, { score: 99_999, descendants: 9_999 });

export const ZeroCounts: Story = withArticle(115, { score: 0, descendants: 0 });

export const NegativeCounts: Story = withArticle(116, { score: -1, descendants: -5 });

/** `descendants` absent from the payload — the component falls back to `0`. */
export const MissingDescendants: Story = withArticle(117, { descendants: undefined });

// ─── mixed extremes ──────────────────────────────────────────────────────────

/** Stacks every edge case into one article for a comprehensive visual review. */
export const AllEdgeCases: Story = withArticle(118, {
  title: 'https://no-spaces-very-long-url-title.example.com/path/nested/resource?a=1&b=2&c=3',
  by: 'username_with_many_characters_that_keeps_going_and_going_and_going',
  score: 99_999,
  descendants: undefined,
  url: undefined,
});
