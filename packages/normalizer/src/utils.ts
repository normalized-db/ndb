import type { SchemaStructure } from './types/normalizer-config-types';
import type { ReverseReferences } from './types/normalizer-types';

export function mergeObjects<T extends Record<string, unknown>>(
  item1: T,
  item2: T,
  merge?: {
    [Key in keyof T]: (value1: T[Key], value2: T[Key]) => T[Key]
  },
): T {
  const merged: any = { ...item1 };
  for (const key of Object.keys(item2)) {
    const existingValue: any = merged[key];
    if (existingValue === undefined || existingValue === null || (Array.isArray(existingValue) && existingValue.length === 0)) {
      merged[key] = item2[key];
    } else if (merge?.[key]) {
      merged[key] = merge[key](existingValue, item2[key] as any);
    }
  }

  return merged;
}

export function mergeReverseReferences<DataTypes extends SchemaStructure>(
  ref1: ReverseReferences<DataTypes>,
  ref2: ReverseReferences<DataTypes>,
): ReverseReferences<DataTypes> {
  const merged: ReverseReferences<DataTypes> = { ...ref1 };
  for (const type of Object.keys(ref2)) {
    const refKeyValue = merged[type];
    if (!refKeyValue) {
      merged[type as keyof DataTypes] = ref2[type];
    } else {
      ref2[type as keyof DataTypes]?.forEach(next => refKeyValue.add(next));
    }
  }

  return merged;
}
