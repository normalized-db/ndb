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
   * - any remaining property will be overridden
   *
   * @param item1
   * @param item2
   */
  export function merge<T extends Record<string, unknown>>(item1: T, item2: T): T {
    const merged: any = { ...item1 };
    for (const key of Object.keys(item2)) {
      const existingValue: any = merged[key];
      if (existingValue === undefined || existingValue === null || (Array.isArray(existingValue) && existingValue.length === 0)) {
        merged[key] = item2[key];
        continue;
      }

      if (
        typeof existingValue === 'object' &&
        !Array.isArray(existingValue) &&
        !(existingValue instanceof Date) &&
        !(existingValue instanceof Blob)
      ) {
        merged[key] = merge(existingValue, item2[key] as any);
      } else {
        merged[key] = item2[key];
      }
    }

    return merged;
  }
}
