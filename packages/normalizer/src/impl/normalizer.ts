import type { KeyTypes, SchemaStructure } from '../types/normalizer-config-types';
import type { NormalizedData, NormalizedItem, NormalizeFunction, NormalizeOptions, ParentRef, Schema } from '../types/normalizer-types';
import { Arrays } from '../utils/arrays';
import { Objects } from '../utils/objects';

export function normalizer<DataTypes extends SchemaStructure>(
  schema: Schema<DataTypes>,
  defaultOptions?: NormalizeOptions<DataTypes>,
): NormalizeFunction<DataTypes> {
  return (rootType, rootData, options) => {
    const uniqueKeyCallback = options?.uniqueKeyCallback ?? defaultOptions?.uniqueKeyCallback;

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

      // log reverse reference in tree of output structure
      const entityTypeTree = Objects.patch(normalizedResult.tree, type, {});
      const entityTree = Objects.patch(entityTypeTree, key, {});
      if (parent) {
        const refs = Objects.patch(entityTree, 'refs', {});
        // @ts-ignore
        Objects.patch(refs, parent.type, [parent.key], (keys) => Arrays.pushDistinct(keys, parent.key).items);
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

        const targetRef = apply(ref, target.type, nestedValue);
        // remove normalized property from normalized structure to safe storage
        delete normalizedItem[nestedProperty as keyof DataTypes[EntityKey]]; // = Array.isArray(targetRef) ? [] : undefined;
        if (targetRef !== undefined) {
          // log property in tree of output structure
          const props = Objects.patch(entityTree, 'props', {});
          Objects.patch(
            props,
            // @ts-ignore
            nestedProperty,
            targetRef,
            (refs) => {
              if (Array.isArray(refs) && Array.isArray(targetRef)) { // both are an array
                return Arrays.mergePrimitive(refs, targetRef);
              } else if (!Array.isArray(refs) && Array.isArray(targetRef)) { // mixing shouldn't even happen, just to be safe
                return Arrays.pushDistinct(targetRef, refs);
              } else if (Array.isArray(refs) && !Array.isArray(targetRef)) { // mixing shouldn't even happen, just to be safe
                return Arrays.pushDistinct(refs, targetRef);
              } else { // neither are arrays
                return targetRef;
              }
            },
          );
        }
      }

      // add normalized object to output
      const normalizedItemsOfType = Objects.patch(normalizedResult.entities, type, []);
      const { index } = Arrays.upsert(normalizedItemsOfType, normalizedItem, (a, b) => a[keyProperty] === b[keyProperty]);
      Objects.patch(normalizedResult.keyMap, type, { [key]: index }, map => ({ ...map, [key]: index }));

      return key;
    }

    return normalizedResult;
  };
}
