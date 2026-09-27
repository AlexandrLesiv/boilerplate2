import { createUniqueId } from 'solid-js';

import { useHead } from '@solidjs/meta';

import type { JsonLdObject, WithContext } from 'schema-dts';

export type JsonLdSchema = WithContext<JsonLdObject>;

export const defineJsonLd = <T extends JsonLdObject>(schema: T): WithContext<T> => ({
  '@context': 'https://schema.org',
  ...schema,
});

const serialize = (schema: JsonLdSchema | JsonLdSchema[]): string => JSON.stringify(schema).replace(/</g, '\\u003c');

// Renders <script type="application/ld+json"> into <head> via MetaProvider.
// Mount conditionally (e.g. with <Show>) — onCleanup in useHead removes the tag on unmount.
export const JsonLd = (props: { schema: JsonLdSchema | JsonLdSchema[] }) => {
  const id = createUniqueId();
  useHead({
    tag: 'script',
    props: {
      type: 'application/ld+json',
      get children() {
        return serialize(props.schema);
      },
    },
    setting: { close: true, escape: false },
    id,
  });
  return null;
};
