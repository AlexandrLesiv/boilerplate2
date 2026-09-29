import { faker } from '@faker-js/faker';
import { articleRoute, ok, okList, topStoriesRoute, type Story } from '@repo/shared';
import { http, HttpResponse } from 'msw';

// Built once per module load so the list and the item endpoint agree: clicking a headline has to
// open that headline. Ids are sequential rather than random for the same reason.
export const hackernewsStories: Story[] = Array.from({ length: 30 }, (_, index) => ({
  id: 10_001 + index,
  title: faker.lorem.sentence({ min: 4, max: 12 }),
  // Every seventh story has no url, so the "no outbound link" branch shows up while browsing.
  url: index % 7 === 0 ? undefined : faker.internet.url(),
  by: faker.internet.username(),
  score: faker.number.int({ min: 1, max: 5000 }),
  descendants: faker.number.int({ min: 0, max: 1000 }),
  time: Math.floor(faker.date.recent({ days: 7 }).getTime() / 1000),
}));

export const topStoriesHandler = http.get(`*${topStoriesRoute.url}`, ({ request }) => {
  const limit = Number(new URL(request.url).searchParams.get('limit') ?? 30);
  const data = hackernewsStories.slice(0, limit);
  return HttpResponse.json(okList(data, data.length));
});

export const articleHandler = http.get(`*${articleRoute.url}`, ({ params }) => {
  const story = hackernewsStories.find((candidate) => candidate.id === Number(params.id));
  if (!story) return HttpResponse.json({ message: 'Article not found' }, { status: 404 });
  return HttpResponse.json(ok(story));
});

export const hackernewsHandlers = [topStoriesHandler, articleHandler];
