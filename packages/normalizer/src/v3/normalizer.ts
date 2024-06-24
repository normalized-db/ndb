import { Schema as LegacySchema } from '../core';
import { NormalizerBuilder } from '../normalizer';
import type { SchemaStructure } from './normalizer-config-types';
import type { NormalizedData, NormalizeFunction, NormalizeOptions } from './normalizer-types';

export function buildNormalizer<DataTypes extends SchemaStructure>(
  schema: LegacySchema,
  defaultOptions?: NormalizeOptions,
): NormalizeFunction<DataTypes> {
  return async (type, data, options) => {
    const impl = new NormalizerBuilder()
      .schema(schema)
      .reverseReferences(options?.reverseRefs !== undefined
        ? options.reverseRefs
        : (defaultOptions?.reverseRefs ?? false))
      .uniqueKeyCallback(options?.uniqueKeyCallback ?? defaultOptions?.uniqueKeyCallback)
      .build();

    const result = await impl.apply(String(type), data);
    const _keyMap = impl.getKeyMap();

    return { ...result, _keyMap } as NormalizedData<DataTypes>;
  };
}
