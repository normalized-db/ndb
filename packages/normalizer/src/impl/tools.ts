import type { KeyTypes, ObjectKey, SchemaStructure } from '../types/normalizer-config-types';
import type { Depth, NormalizedDataTree, PreloadEntities, Schema, UtilsFunction } from '../types/normalizer-types';

export function buildTools<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
): UtilsFunction<DataTypes> {

  function findEntityKeys<
    EntityType extends keyof DataTypes,
    KeyPath extends ObjectKey<DataTypes[EntityType], KeyTypes>,
    Key extends DataTypes[EntityType][KeyPath],
  >(
    tree: NormalizedDataTree<DataTypes>,
    rootType: EntityType,
    { rootKeys, depth: rootDepth }: {
      rootKeys?: Key | Key[],
      depth?: Depth,
    } = {},
  ) {
    const { entities, addEntities, hasVisited } = entityMap<DataTypes>();
    traverse(
      rootType,
      rootKeys === undefined
        ? undefined
        : Array.isArray(rootKeys)
          ? new Set(rootKeys)
          : new Set([rootKeys]),
      rootDepth,
    );

    function traverse<
      EntityType extends keyof DataTypes,
      KeyPath extends ObjectKey<DataTypes[EntityType], KeyTypes>,
      Key extends DataTypes[EntityType][KeyPath]
    >(
      type: EntityType,
      keys: Set<Key> | undefined,
      depth: Depth | undefined,
    ) {
      if (depth === 0) {
        return;
      }

      const typeSchema = schema[type];
      if (!typeSchema) {
        throw new Error(`Missing schema for type ${String(type)}`);
      }

      const typeTree = tree[type];
      if (!typeTree) {
        throw new Error(`Missing data for type ${String(type)}`);
      }

      for (const entityKey in typeTree) {
        const typedEntityKey = (isNaN(+entityKey) ? entityKey : +entityKey) as Key;
        if ((keys !== undefined && !keys.has(typedEntityKey)) || hasVisited(type, entityKey)) {
          continue;
        }

        addEntities(type, typedEntityKey);

        const nestedEntities = typeTree[typedEntityKey]?.props;
        if (!nestedEntities) {
          continue;
        }

        for (const nestedProperty in nestedEntities) {
          const target = typeSchema.targets[nestedProperty];
          if (!target) {
            throw new Error(`Missing target for ${String(type)}.${String(nestedProperty)}`);
          }

          const nestedKeys = nestedEntities[nestedProperty as keyof typeof nestedEntities];
          if (nestedKeys) {
            const nextKeys = Array.isArray(nestedKeys) ? new Set(nestedKeys) : new Set([nestedKeys]);
            const nextDepth = typeof depth === 'number' ? depth - 1 : depth?.[nestedProperty];
            traverse(target.type, nextKeys, nextDepth);
          }
        }
      }
    }

    return entities;
  }

  return {
    findEntityKeys,
  };
}

function entityMap<DataTypes extends SchemaStructure>() {
  const entities: PreloadEntities<DataTypes> = new Map();
  const visitedKeys = new Set<string>();

  function addEntities<EntityType extends keyof DataTypes>(type: EntityType, keys: KeyTypes | KeyTypes[]) {
    let keysToLoad = entities.get(type);
    if (!keysToLoad) {
      keysToLoad = new Set();
      entities.set(type, keysToLoad);
    }

    for (const key of Array.isArray(keys) ? keys : [keys]) {
      keysToLoad.add(key);
      visitedKeys.add(`${String(type)}.${key}`);
    }
  }

  function hasVisited<EntityType extends keyof DataTypes>(type: EntityType, key: KeyTypes) {
    return visitedKeys.has(`${String(type)}.${key}`);
  }

  return { entities, addEntities, hasVisited };
}
