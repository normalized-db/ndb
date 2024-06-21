import { KeyMap, NdbDocument, NormalizedData, UniqueKeyCallback } from '../core';

export interface INormalizer {
  apply<T extends NdbDocument>(type: string, data: T | T[]): Promise<NormalizedData>;

  getUniqueKeyCallback(): UniqueKeyCallback;

  getKeyMap(): KeyMap;
}
