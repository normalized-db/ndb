import type { KeyTypes, ObjectKey, SchemaStructure } from '../types/normalizer-config-types';
import type { NormalizedDataTree, PreloadEntities, Schema, StateFunction } from '../types/normalizer-types';
import { Objects } from '../utils/objects';

export function buildState<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
): StateFunction<DataTypes> {

  function mergeTrees(tree1: NormalizedDataTree<DataTypes>, tree2: NormalizedDataTree<DataTypes>) {
    const mergedTree: NormalizedDataTree<DataTypes> = { ...tree1 };
    for (const typeOfTree2 in tree2) {
      const typeTree2 = tree2[typeOfTree2];
      Objects.patch(mergedTree, typeOfTree2, typeTree2 as any, typeTree1 => {
        for (const entityKey2 in typeTree2) {
          const entity2 = typeTree2[entityKey2];
          Objects.patch(typeTree1, entityKey2, entity2, entity1 => Objects.merge(entity1, entity2));
        }
        return typeTree1;
      });
    }

    return mergedTree;
  }

  // TODO add Depth parameter
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
    traverse(
      rootType,
      rootKeys === undefined
        ? undefined
        : Array.isArray(rootKeys)
          ? new Set(rootKeys)
          : new Set([rootKeys]),
    );

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
            traverse(target.type, Array.isArray(nestedKeys) ? new Set(nestedKeys) : new Set([nestedKeys]));
          }
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
