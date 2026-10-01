import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { articleRoute, ok, okList, topStoriesRoute, type Story } from '@repo/shared';

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

// Hacker News items carry no article body at all — this stands in for the body content the real
// API doesn't provide, attached only to the single-article response (not the top-stories list,
// which never reads it). Plain Latin filler, not real content, so there's nothing to localize —
// see `StoryEntity.content` for why this is `Optional` rather than a field every item carries.
const PLACEHOLDER_CONTENT = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
  'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
  'Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.',
  'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur.',
];

async function hnGet<T>(path: string): Promise<T> {
  const res = await fetch(`${HN_BASE}${path}`);
  if (!res.ok) throw new Error(`HN API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const hackerNewsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(topStoriesRoute.url, { schema: topStoriesRoute.schema }, async (request) => {
    const limit = request.query.limit ?? 30;
    const ids = await hnGet<number[]>('/topstories.json');
    const top = ids.slice(0, limit);
    const items = await Promise.all(top.map((id) => hnGet<Story & { type: string }>(`/item/${id}.json`)));
    const stories = items.filter((s) => s.type === 'story');
    return okList(stories, stories.length);
  });

  fastify.get(articleRoute.url, { schema: articleRoute.schema }, async (request, reply) => {
    const item = await hnGet<(Story & { type: string }) | null>(`/item/${request.params.id}.json`);
    if (!item || item.type !== 'story') {
      return reply.code(404).send({ message: 'Article not found' });
    }
    return ok({ ...item, content: PLACEHOLDER_CONTENT });
  });
};
