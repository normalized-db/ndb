import { Objects } from './objects';

export namespace Arrays {

  export function pushDistinct<T extends {}>(items: T[], item: T, eq: (item1: T, item2: T) => boolean): { items: T[], index: number };
  export function pushDistinct<T extends string | number>(items: T[], item: T): { items: T[], index: number };
  export function pushDistinct<T>(items: T[], item: T, eq?: (item1: T, item2: T) => boolean): { items: T[], index: number } {
    let index = eq ? items.findIndex(other => eq(other, item)) : items.indexOf(item);
    if (index < 0) {
      index = items.length;
      items.push(item);
    }
    return { items, index };
  }

  export function upsert<T extends {}>(items: T[], item: T, eq: (item1: T, item2: T) => boolean): { items: T[], index: number } {
    let index = eq ? items.findIndex(other => eq(other, item)) : items.indexOf(item);
    if (index < 0) {
      index = items.length;
      items.push(item);
    } else {
      items[index] = Objects.merge(items[index], item);
    }
    return { items, index };
  }

  export function merge<T extends {}>(items1: T[], items2: T[], eq: (item1: T, item2: T) => boolean): T[] {
    const merged = items1.map(other => ({ ...other }));
    for (const other of items2) {
      upsert(merged, other, eq);
    }
    return merged;
  }

  export function mergePrimitive<T extends string | number>(items1: T[], items2: T[]): T[] {
    const merged = [...items1];
    for (const other of items2) {
      pushDistinct(merged, other);
    }
    return merged;
  }

}
