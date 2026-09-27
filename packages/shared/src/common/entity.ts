import { Type, type Static, type TObject, type TProperties } from '@sinclair/typebox';

export function defineEntity<P extends TProperties>(id: string, properties: P): TObject<P> {
  return Type.Object(properties, { $id: id, title: id });
}

export type InferEntity<T extends TObject> = Static<T>;
