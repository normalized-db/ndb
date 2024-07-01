import type { KeyTypes, ObjectKey, SchemaStructure } from './normalizer-config-types';
import type { DenormalizerFactory, DenormalizerFactoryOptions, Depth, Schema } from './normalizer-types';

export function denormalizer<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
  defaultOptions?: DenormalizerFactoryOptions<DataTypes, any, any>,
): DenormalizerFactory<DataTypes> {
  return (normalizedData, type, options) => {
    const depth = options?.depth !== undefined ? options.depth : defaultOptions?.depth;
    const deleteReverseRefs = options?.reverseRefsDeleted !== undefined
      ? options.reverseRefsDeleted
      : (defaultOptions?.reverseRefsDeleted ?? false);
    const fetchCallback = options?.fetchCallback ?? defaultOptions?.fetchCallback;

    function fromKey<
      EntityKey extends keyof DataTypes,
      KeyPath extends ObjectKey<DataTypes[EntityKey], KeyTypes>,
      T extends DataTypes[EntityKey]
    >(nestedType: EntityKey, key: T[KeyPath], nestedDepth: number | Depth): T {
      const { key: keyProperty, targets } = schema[nestedType];
      const index = normalizedData.keyMap[nestedType]?.get(key);

      const entity = index >= 0
        ? normalizedData.entities[nestedType][index]
        : normalizedData.entities[nestedType].find(entity => entity[keyProperty] === key);

      if (entity === undefined || entity === null) {
        throw new Error(`Could not find entity ${String(nestedType)} with key ${String(keyProperty)}=${key} in normalized data`);
      }

      const denormalizedEntity = {...entity};
      if (typeof nestedDepth !== 'number' || nestedDepth > 0) {
        for (const [nestedProperty, target] of Object.entries(targets)) {
          const nextDepth = typeof nestedDepth === 'number' ? nestedDepth - 1 : nestedDepth?.[nestedProperty];
          const nestedKeys = entity[nestedProperty];
          denormalizedEntity[nestedProperty] = Array.isArray(nestedKeys)
            ? fromKeys(target.type, nestedKeys, nextDepth)
            : fromKey(target.type, nestedKeys, nextDepth);
        }
      }

      if (deleteReverseRefs) {
        delete denormalizedEntity._refs;
      }

      return denormalizedEntity;
    }

    function fromKeys<
      EntityKey extends keyof DataTypes,
      KeyPath extends ObjectKey<DataTypes[EntityKey], KeyTypes>,
      T extends DataTypes[EntityKey]
    >(nestedType: EntityKey, keys: T[KeyPath][], nestedDepth: number | Depth): T[] {
      return keys.map(key => fromKey(nestedType, key, nestedDepth));
    }

    function fromData<
      EntityKey extends keyof DataTypes,
      T extends DataTypes[EntityKey]
    >(data: Partial<T>): T {
      const { key: keyProperty } = schema[type];
      const key = data[keyProperty];
      if (key === undefined || key === null) {
        throw new Error(`Key "${String(type)}.${String(keyProperty)}" is missing, cannot denormalize`);
      }

      return fromKey(type, key, depth);
    }

    function fromArray<
      EntityKey extends keyof DataTypes,
      T extends DataTypes[EntityKey]
    >(data: Partial<T>[]): T[] {
      return data.map(fromData);
    }

    return {
      fromKey: key => fromKey(type, key, depth),
      fromKeys: keys => fromKeys(type, keys, depth),
      fromData,
      fromArray,
    };
  };
}
