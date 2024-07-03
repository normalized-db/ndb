export namespace Objects {

  export function patch<T, K extends keyof T>(
    item: T,
    property: K,
    defaultValue: NonNullable<T[K]>,
    merge?: (value: NonNullable<T[K]>) => NonNullable<T[K]>,
  ): NonNullable<T[K]> {
    const existing = item[property];
    if (existing !== undefined && existing !== null) {
      if (!merge) {
        return existing;
      }

      const merged = merge(existing);
      item[property] = merged;
      return merged;
    }

    item[property] = defaultValue;
    return defaultValue;
  }

  /**
   * Currently implemented merge strategy is as follows:
   * - `undefined`/`null`-values and empty arrays are always replaced
   * - if, for a property, a merge function is specified, this will be called
   * - any remaining property will be overridden
   *
   * @param item1
   * @param item2
   * @param merge
   */
  export function merge<T extends Record<string, unknown>>(
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
        continue;
      }

      const customMergeFunc = merge?.[key];
      if (customMergeFunc) {
        merged[key] = customMergeFunc(existingValue, item2[key] as any);
      } else {
        merged[key] = item2[key];
      }
    }

    return merged;
  }
}
