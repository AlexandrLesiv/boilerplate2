import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { articleRoute, ok, okList, topStoriesRoute, type Story } from '@repo/shared';

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

async function hnGet<T>(path: string): Promise<T> {
  const res = await fetch(`${HN_BASE}${path}`);
  if (!res.ok) throw new Error(`HN API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const hackerNewsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    topStoriesRoute.url,
    { schema: topStoriesRoute.schema },
    async (request) => {
      const limit = request.query.limit ?? 30;
      const ids = await hnGet<number[]>('/topstories.json');
      const top = ids.slice(0, limit);
      const items = await Promise.all(top.map((id) => hnGet<Story & { type: string }>(`/item/${id}.json`)));
      const stories = items.filter((s) => s.type === 'story');
      return okList(stories, stories.length);
    },
  );

  fastify.get(
    articleRoute.url,
    { schema: articleRoute.schema },
    async (request, reply) => {
      const item = await hnGet<(Story & { type: string }) | null>(`/item/${request.params.id}.json`);
      if (!item || item.type !== 'story') {
        return reply.code(404).send({ message: 'Article not found' });
      }
      return ok(item);
    },
  );
};
