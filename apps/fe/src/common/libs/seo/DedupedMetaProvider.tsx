import type { ParentProps } from 'solid-js';
import { useContext } from 'solid-js';
import { isServer } from 'solid-js/web';

import { MetaContext } from '@solidjs/meta';
import type { MetaContextType } from '@solidjs/meta';

// In async SSR, Solid re-renders a suspended boundary once its resources resolve, so the
// components inside it call `useHead` twice. @solidjs/meta de-duplicates only cascading
// tags (`title`, `meta`); `link` and `script` get emitted twice, and hydration claims
// just the first, leaving a stale twin in <head> forever. Two <link rel="canonical"> or
// two JSON-LD blocks is an SEO bug, and crawlers that never run JS see the duplicates in
// the raw HTML — so this has to be fixed server-side, not swept up on the client.
//
// The re-render produces *new* tag objects, but the hydration id counter is reset along
// with the boundary, so the retry reuses the same `createUniqueId()` value. That id is
// what identifies a repeat push. Dropping the later one is safe: `renderTags` reads
// `tag.props` lazily when the head is serialized, after resources have resolved, so the
// surviving tag serializes the same resolved values the retry would have produced.
//
// Distinct components that emit the same tag (a page overriding the layout's description,
// say) get distinct ids, so the library's cascading override still works untouched.
export const DedupedMetaProvider = (props: ParentProps) => {
  const inner = useContext(MetaContext);
  if (!inner) throw new Error('<DedupedMetaProvider /> must be rendered inside <MetaProvider />');

  const seen = new Set<string>();
  const actions: MetaContextType = isServer
    ? {
        addTag: (tag) => {
          if (seen.has(tag.id)) return -1;
          seen.add(tag.id);
          return inner.addTag(tag);
        },
        removeTag: (tag, index) => inner.removeTag(tag, index),
      }
    : inner;

  return <MetaContext.Provider value={actions}>{props.children}</MetaContext.Provider>;
};
