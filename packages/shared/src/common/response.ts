import { Type, type TSchema } from '@sinclair/typebox';

export function defineResponse<T extends TSchema>(schema: T) {
  return Type.Object({ data: schema });
}

export function defineListResponse<T extends TSchema>(schema: T) {
  return Type.Object({
    data: Type.Array(schema),
    meta: Type.Object({
      total: Type.Integer({ minimum: 0 }),
      isOk: Type.Boolean(),
    }),
  });
}

export function ok<T>(data: T): { data: T } {
  return { data };
}

export function okList<T>(data: T[], total: number): { data: T[]; meta: { total: number; isOk: boolean } } {
  return { data, meta: { total, isOk: true } };
}
