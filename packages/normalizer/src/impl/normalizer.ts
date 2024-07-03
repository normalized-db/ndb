import type { KeyTypes, SchemaStructure } from '../types/normalizer-config-types';
import type { NormalizedData, NormalizedItem, NormalizeFunction, NormalizeOptions, ParentRef, Schema } from '../types/normalizer-types';
import { mergeObjects, mergeReverseReferences } from '../utils';

export function normalizer<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
  defaultOptions?: NormalizeOptions<DataTypes>,
): NormalizeFunction<DataTypes> {
  return (rootType, rootData, options) => {
    const uniqueKeyCallback = options?.uniqueKeyCallback ?? defaultOptions?.uniqueKeyCallback;
    const hasReverseReferences = options?.reverseRefs !== undefined
      ? options.reverseRefs
      : (defaultOptions?.reverseRefs ?? false);

    const normalizedResult: NormalizedData<DataTypes> = { keyMap: {}, tree: {}, entities: {} };
    apply(undefined, rootType, rootData);

    function apply<EntityKey extends keyof DataTypes, T extends DataTypes[EntityKey]>(
      parent: ParentRef<DataTypes, any, any>,
      type: EntityKey,
      item: T | T[] | undefined | null,
    ): KeyTypes | KeyTypes[] | undefined {
      if (item === undefined || item === null) {
        return undefined;
      } else if (Array.isArray(item)) {
        return applyArray(parent, type, item);
      } else {
        return applyObject(parent, type, item);
      }
    }

    function applyArray<EntityKey extends keyof DataTypes, T extends DataTypes[EntityKey]>(
      parent: ParentRef<DataTypes, any, any>,
      type: EntityKey,
      items: T[],
    ): KeyTypes[] {
      return items
        .map(item => apply(parent, type, item))
        .filter(key => !!key) as KeyTypes[];
    }

    function applyObject<EntityKey extends keyof DataTypes, T extends DataTypes[EntityKey]>(
      parent: ParentRef<DataTypes, any, any>,
      type: EntityKey,
      item: T,
    ): KeyTypes {
      const { key: keyProperty, targets } = schema[type];
      const normalizedItem: NormalizedItem<DataTypes, EntityKey> = { ...item };

      // retrieve and verify unique key
      let key = item[keyProperty];
      if (key === undefined || key === null) {
        if (!uniqueKeyCallback) {
          throw new Error(`Key ${String(type)}.${String(keyProperty)} is missing`);
        }
        key = uniqueKeyCallback<EntityKey, T>(type);
      }

      // add reverse reference to parent (if any)
      if (parent && hasReverseReferences) {
        normalizedItem._refs = {
          [parent.type]: new Set<KeyTypes>([parent.key]),
        };
      }

      // log entity in tree
      const tree = normalizedResult.tree[type];
      if (!tree) {
        normalizedResult.tree[type] = new Map([[key, undefined]]);
      } else {
        tree.set(key, undefined);
      }

      // extract nested objects and arrays
      const ref: ParentRef<DataTypes, any, any> = { type, key };
      for (const [nestedProperty, target] of Object.entries(targets)) {
        if (!target) {
          throw new Error(`${String(type)}.${nestedProperty} has undefined target`);
        }

        const nestedValue = item[nestedProperty];
        if (nestedValue === undefined || nestedValue === null) {
          continue;
        } else if (target.isArray && !Array.isArray(nestedValue)) {
          throw new Error(`${ref.type}[${ref.key}].${nestedProperty} expected nested array but was ${typeof nestedValue}`);
        } else if (!target.isArray && Array.isArray(nestedValue)) {
          throw new Error(`${ref.type}[${ref.key}].${nestedProperty} expected nested object but was array`);
        }

        // log reference in tree of output structure
        const targetRef = apply(ref, target.type, nestedValue);
        normalizedItem[nestedProperty] = targetRef;
        if (targetRef !== undefined) {
          const distinctTargetRefs = Array.isArray(targetRef) ? new Set(targetRef) : targetRef;
          const tree = normalizedResult.tree[type];
          const entityTree = tree!.get(key);
          if (!entityTree) {
            tree!.set(key, new Map([[nestedProperty, distinctTargetRefs]]));
          } else {
            entityTree.set(nestedProperty, distinctTargetRefs);
          }
        }
      }

      // add to output
      const normalizedItemsOfType = normalizedResult.entities[type];
      if (!normalizedItemsOfType) {
        normalizedResult.keyMap[type] = new Map([[key, 0]]);
        normalizedResult.entities[type] = [normalizedItem];
      } else {
        const keyMapOfType = normalizedResult.keyMap[type]!;
        const existingIndex = keyMapOfType.get(key);
        if (existingIndex === undefined) {
          keyMapOfType.set(key, normalizedItemsOfType.length);
          normalizedItemsOfType.push(normalizedItem);
        } else {
          normalizedItemsOfType[existingIndex] = mergeObjects<T>(
            normalizedItemsOfType[existingIndex],
            normalizedItem,
            // @ts-ignore
            hasReverseReferences
              ? { _refs: mergeReverseReferences }
              : undefined,
          );
        }
      }

      return key;
    }

    return normalizedResult;
  };
}
