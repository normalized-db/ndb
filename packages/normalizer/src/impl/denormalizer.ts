import type { KeyTypes, ObjectKey, SchemaStructure } from '../types/normalizer-config-types';
import type {
  DenormalizeFunction,
  DenormalizerFactory,
  DenormalizerFactoryOptions,
  Depth,
  NormalizedData,
  Schema,
} from '../types/normalizer-types';

export function denormalizerFactory<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
  defaultOptions?: DenormalizerFactoryOptions<DataTypes, any, any>,
): DenormalizerFactory<DataTypes> {

  return {
    async preload(tree, entities, load) {
      const data: NormalizedData<DataTypes> = { tree, keyMap: {}, entities: {} };
      for (const [type, keys] of entities) {
        const denormalizedItems = await load(type, [...keys].toSorted());
        for (const item of denormalizedItems) {
          const key = item[schema[type].key];
          const keyMap = data.keyMap[type];
          if (!keyMap) {
            data.keyMap[type] = new Map([[key, 0]]);
            data.entities[type] = [item];
          } else {
            keyMap.set(key, data.entities[type]?.length ?? 0);
            data.entities[type]!.push(item);
          }
        }
      }

      return {
        ofType: denormalizer(schema, data, defaultOptions),
      };
    },
    fromData(data) {
      return {
        ofType: denormalizer(schema, data, defaultOptions),
      };
    },
  };
}

export function denormalizer<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
  normalizedData: NormalizedData<DataTypes>,
  defaultOptions?: DenormalizerFactoryOptions<DataTypes, any, any>,
): DenormalizeFunction<DataTypes> {
  return (type, options) => {
    const depth = (options?.depth !== undefined ? options.depth : defaultOptions?.depth) as Depth | undefined;
    const deleteReverseRefs = options?.reverseRefsDeleted !== undefined
      ? options.reverseRefsDeleted
      : (defaultOptions?.reverseRefsDeleted ?? false);

    function fromKey<
      EntityKey extends keyof DataTypes,
      KeyPath extends ObjectKey<DataTypes[EntityKey], KeyTypes>,
      T extends DataTypes[EntityKey]
    >(nestedType: EntityKey, key: T[KeyPath], nestedDepth: Depth | undefined): T {
      const { key: keyProperty, targets } = schema[nestedType];
      const index = normalizedData.keyMap[nestedType]?.get(key);
      const entity = index !== undefined && index >= 0
        ? normalizedData.entities[nestedType]?.[index]
        : normalizedData.entities[nestedType]?.find(entity => entity[keyProperty] === key);

      if (entity === undefined || entity === null) {
        throw new Error(`Could not find entity ${String(nestedType)} with key ${String(keyProperty)}=${key} in normalized data`);
      }

      const denormalizedEntity = {...entity};
      if (typeof nestedDepth !== 'number' || nestedDepth > 0) {
        for (const [nestedProperty, target] of Object.entries(targets)) {
          if (!target) {
            throw new Error(`${String(nestedType)}[${key}].${nestedProperty} is missing target schema`);
          }

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
    >(nestedType: EntityKey, keys: T[KeyPath][], nestedDepth: Depth | undefined): T[] {
      return keys.map(key => fromKey(nestedType, key, nestedDepth));
    }

    return {
      fromKey: key => fromKey(type, key, depth),
      fromKeys: keys => fromKeys(type, keys, depth),
    };
  };
}