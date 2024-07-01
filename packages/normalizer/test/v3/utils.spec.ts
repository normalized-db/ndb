import { describe, expect, it } from '@jest/globals';
import { mergeObjects } from '../../src/v3/utils';

describe('NormalizedDB v3', function () {

  describe('Utils', function () {

    describe('Merge', function () {
      it('Distinct properties', async function () {
        const actual = mergeObjects({ item1: true }, { item2: true });
        expect(actual).toEqual({ item1: true, item2: true });
      });

      it('Skip duplicates', async function () {
        const actual = mergeObjects({ item1: true, item2: false }, { item2: true });
        expect(actual).toEqual({ item1: true, item2: false });
      });

      it('Merge null/undefined', async function () {
        const actual = mergeObjects({ item1: undefined }, { item1: false, item2: true });
        expect(actual).toEqual({ item1: false, item2: true });
      });

      it('Custom merge', async function () {
        const actual = mergeObjects(
          { data: new Set(['item1']) },
          { data: new Set(['item2']) },
          {
            data: (value1, value2) => {
              const merged = new Set(value1);
              value2.forEach(next => merged.add(next));
              return merged;
            },
          },
        );
        expect(actual).toEqual({ data: new Set(['item1', 'item2']) });
      });
    });

  });

});
