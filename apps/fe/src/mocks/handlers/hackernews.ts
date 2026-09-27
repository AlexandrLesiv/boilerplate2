import { faker } from '@faker-js/faker';
import { topStoriesRoute } from '@repo/shared';
import { http, HttpResponse } from 'msw';

function fakeStory() {
  return {
    id: faker.number.int({ min: 1, max: 99_999_999 }),
    title: faker.lorem.sentence({ min: 4, max: 12 }),
    url: faker.internet.url(),
    by: faker.internet.username(),
    score: faker.number.int({ min: 1, max: 5000 }),
    descendants: faker.number.int({ min: 0, max: 1000 }),
    time: Math.floor(faker.date.recent({ days: 7 }).getTime() / 1000),
  };
}

export const hackernewsHandlers = [
  http.get(`*${topStoriesRoute.url}`, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 30);
    const data = Array.from({ length: limit }, fakeStory);
    return HttpResponse.json({ data, meta: { total: data.length, isOk: true } });
  }),
];
