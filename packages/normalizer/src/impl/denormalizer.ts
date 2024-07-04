import type { KeyTypes, ObjectKey, SchemaStructure } from '../types/normalizer-config-types';
import type {
  DenormalizeFunction,
  DenormalizerFactoryOptions,
  DenormalizerLoader,
  Depth,
  NormalizedData,
  Schema,
} from '../types/normalizer-types';
import { Ndb } from '../utils/ndb';
import { Objects } from '../utils/objects';

export function denormalizerFactory<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
  defaultOptions?: DenormalizerFactoryOptions<DataTypes, any, any>,
): DenormalizerLoader<DataTypes> {
  return {
    async preload(tree, type, load, options) {
      const entities = Ndb.findEntityKeys(schema, tree, type, options);
      const normalizedData: NormalizedData<DataTypes> = { tree, keyMap: {}, entities: {} };
      for (const [type, keys] of entities) {
        const denormalizedItems = await load(type, [...keys].toSorted());
        for (const item of denormalizedItems) {
          const entities = Objects.patch(normalizedData.entities, type, []);
          const index = entities.length;
          entities.push(item);
          const key = item[schema[type].key];
          Objects.patch(normalizedData.keyMap, type, { [key]: index }, map => ({ ...map, [key]: index }));
        }
      }

      return denormalizer(schema, normalizedData, defaultOptions)(type, options);
    },
    withData(normalizedData) {
      return {
        ofType: denormalizer(schema, normalizedData, defaultOptions),
      };
    },
  };
}

export function denormalizer<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
  normalizedData: NormalizedData<DataTypes>,
  defaultOptions?: DenormalizerFactoryOptions<DataTypes, any, any>,
): DenormalizeFunction<DataTypes> {
  return (rootType, options) => {
    const rootDepth = (options?.depth !== undefined ? options.depth : defaultOptions?.depth) as Depth | undefined;

    function fromKey<
      EntityKey extends keyof DataTypes,
      KeyPath extends ObjectKey<DataTypes[EntityKey], KeyTypes>,
      T extends DataTypes[EntityKey]
    >(type: EntityKey, key: T[KeyPath], depth: Depth | undefined): T {
      const { key: keyProperty, targets } = schema[type];
      const index = normalizedData.keyMap[type]?.[key];
      const entity = index !== undefined && index >= 0
        ? normalizedData.entities[type]?.[index]
        : normalizedData.entities[type]?.find(entity => entity[keyProperty] === key);

      if (entity === undefined || entity === null) {
        throw new Error(`Could not find entity ${String(type)} with key ${String(keyProperty)}=${key} in normalized data`);
      }

      const denormalizedEntity = { ...entity };
      if (!Ndb.isDone<any>(depth)) {
        for (const [nestedProperty, target] of Object.entries(targets)) {
          if (!target) {
            throw new Error(`${String(type)}[${key}].${nestedProperty} is missing target schema`);
          }

          const nextDepth = Ndb.nextDepth<any>(depth, nestedProperty);
          // @ts-ignore
          const nestedKeys = normalizedData.tree[type]?.[key]?.props?.[nestedProperty];
          denormalizedEntity[nestedProperty as keyof DataTypes[EntityKey]] = Array.isArray(nestedKeys)
            ? fromKeys(target.type, nestedKeys, nextDepth)
            : fromKey(target.type, nestedKeys, nextDepth);
        }
      }

      return denormalizedEntity as T;
    }

    function fromKeys<
      EntityKey extends keyof DataTypes,
      KeyPath extends ObjectKey<DataTypes[EntityKey], KeyTypes>,
      T extends DataTypes[EntityKey]
    >(nestedType: EntityKey, keys: T[KeyPath][], nestedDepth: Depth | undefined): T[] {
      return keys.map(key => fromKey(nestedType, key, nestedDepth));
    }

    return {
      normalizedData,
      fromKey: rootKey => fromKey(rootType, rootKey, rootDepth),
      fromKeys: rootKeys => fromKeys(rootType, rootKeys, rootDepth),
      all: () => {
        const keyMap = normalizedData.keyMap[rootType];
        const keys = keyMap ? Object.keys(keyMap) : [];
        return keys.length > 0 ? fromKeys(rootType, [...keys], rootDepth) : [];
      },
    };
  };
}
