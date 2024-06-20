import { MathAddon } from './math.ts';

export namespace Arrays {

  export function factory<T>(count: number, factory: (id: number) => T): T[] {
    return new Array(count).fill(0).map((_, i) => factory(i + 1));
  }

  export function getRandom<T>(data: T[]): T {
    return data[MathAddon.randomInt(0, data.length)];
  }

}
