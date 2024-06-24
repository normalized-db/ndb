import { Schema as LegacySchema } from '../core';
import { DenormalizerBuilder } from '../denormalizer';
import type { SchemaStructure } from './normalizer-config-types';
import type { DenormalizerFactory, DenormalizerFactoryOptions } from './normalizer-types';

export function buildDenormalizer<DataTypes extends SchemaStructure>(
  schema: LegacySchema,
  defaultOptions?: DenormalizerFactoryOptions,
): DenormalizerFactory<DataTypes> {
  return (normalizedData, type, options) => {
    const depth = options?.depth !== undefined ? options.depth : defaultOptions?.depth;
    const impl = new DenormalizerBuilder()
      .schema(schema)
      .normalizedData(normalizedData as any)
      .keys(normalizedData._keyMap as any)
      .reverseRefsDeleted(options?.reverseRefsDeleted !== undefined
        ? options.reverseRefsDeleted
        : (defaultOptions?.reverseRefsDeleted ?? false))
      .fetchCallback(options?.fetchCallback ?? defaultOptions?.fetchCallback)
      .build();

    return {
      fromArray(data) {
        return impl.applyAll(String(type), data, depth);
      },
      fromData(data) {
        return impl.apply(String(type), data, depth);
      },
      fromKeys(keys) {
        return impl.applyAllKeys(String(type), keys, depth);
      },
      fromKey(key) {
        return impl.applyKey(String(type), key, depth);
      },
    };
  };
}
