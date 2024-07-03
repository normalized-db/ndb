export type FlattenArray<T> = T extends Array<infer U>
  ? FlattenArray<U>
  : T;
