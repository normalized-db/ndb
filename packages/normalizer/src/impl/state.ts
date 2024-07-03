import type { KeyTypes, ObjectKey, SchemaStructure } from '../types/normalizer-config-types';
import type { NormalizedDataTree, PreloadEntities, Schema, StateFunction } from '../types/normalizer-types';

export function buildState<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
): StateFunction<DataTypes> {

  function mergeTrees(tree1: NormalizedDataTree<DataTypes>, tree2: NormalizedDataTree<DataTypes>) {
    const merged: NormalizedDataTree<DataTypes> = Object.entries(tree1)
      .reduce((clone, [type, map]) => ({ ...clone, [type]: new Map(map) }), {});
    for (const type of Object.keys(tree2)) {
      const mergedType = merged[type];
      if (!mergedType) {
        merged[type as keyof DataTypes] = tree2[type];
      } else {
        tree2[type]?.forEach((nestedProperties, key) => {
          const mergedNested = mergedType.get(key);
          if (!mergedNested) {
            mergedType.set(key, nestedProperties ? new Map(nestedProperties) : undefined);
          } else if (nestedProperties) {
            nestedProperties.forEach((nestedKeys, propertyKey) => {
              const mergedKeys = mergedNested.get(propertyKey);
              if (mergedKeys === undefined || !(mergedKeys instanceof Set)) {
                mergedNested.set(propertyKey, nestedKeys);
              } else if (nestedKeys instanceof Set) {
                nestedKeys.forEach(nestedKey => mergedKeys.add(nestedKey));
              } else {
                mergedKeys.add(nestedKeys);
              }
            });
          }
        });
      }
    }

    return merged;
  }

  function findEntityKeys<
    EntityType extends keyof DataTypes,
    KeyPath extends ObjectKey<DataTypes[EntityType], KeyTypes>,
    Key extends DataTypes[EntityType][KeyPath],
  >(
    tree: NormalizedDataTree<DataTypes>,
    rootType: EntityType,
    rootKeys?: Key | Key[],
  ) {
    const { entities, addEntities, hasVisited } = entityMap<DataTypes>();
    traverse(rootType, rootKeys === undefined ? undefined : Array.isArray(rootKeys) ? new Set(rootKeys) : new Set([rootKeys]));

    function traverse<
      EntityType extends keyof DataTypes,
      KeyPath extends ObjectKey<DataTypes[EntityType], KeyTypes>,
      Key extends DataTypes[EntityType][KeyPath]
    >(
      type: EntityType,
      keys: Set<Key> | undefined,
    ) {
      const typeSchema = schema[type];
      if (!typeSchema) {
        throw new Error(`Missing schema for type ${String(type)}`);
      }

      const typeTree = tree[type];
      if (!typeTree || typeTree.size === 0) {
        throw new Error(`Missing data for type ${String(type)}`);
      }

      for (const [entityKey, nestedEntities] of typeTree) {
        if ((keys !== undefined && !keys.has(entityKey as Key)) || hasVisited(type, entityKey)) {
          continue;
        }

        addEntities(type, entityKey);

        if (!nestedEntities) {
          continue;
        }

        for (const [nestedProperty, nestedKeys] of nestedEntities) {
          const target = typeSchema.targets[nestedProperty];
          if (!target) {
            throw new Error(`Missing target for ${String(type)}.${String(nestedProperty)}`);
          }
          traverse(target.type, nestedKeys instanceof Set ? nestedKeys : new Set([nestedKeys]));
        }
      }
    }

    return entities;
  }

  return {
    mergeTrees,
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
