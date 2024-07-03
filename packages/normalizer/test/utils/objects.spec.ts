import { describe, expect, it } from '@jest/globals';
import { Objects } from '../../src/utils/objects';

describe('Object Utils', function () {

  describe('Safe get', function () {

    it('Existing value', async function () {
      const actual = Objects.patch({ foo: ['bar'] }, 'foo', []);
      expect(actual).toEqual(['bar']);
    });

    it('Fallback value', async function () {
      const actual = Objects.patch<{ foo?: string[] }, 'foo'>({}, 'foo', []);
      expect(actual).toEqual([]);
    });

    it('Existing value with merge', async function () {
      const actual = Objects.patch(
        { foo: ['existing'] },
        'foo',
        ['default'],
        foo => foo.concat(['merged']),
      );
      expect(actual).toEqual(['existing', 'merged']);
    });

    it('Fallback value with merge', async function () {
      const actual = Objects.patch<{ foo?: string[] }, 'foo'>(
        {},
        'foo',
        ['default'],
        foo => foo.concat(['merged']),
      );
      expect(actual).toEqual(['default']);
    });
  });

  describe('Merge', function () {

    it('Distinct properties', async function () {
      const actual = Objects.merge({ item1: true }, { item2: true });
      expect(actual).toEqual({ item1: true, item2: true });
    });

    it('Merge null/undefined', async function () {
      const actual = Objects.merge({ item1: undefined }, { item1: false, item2: true });
      expect(actual).toEqual({ item1: false, item2: true });
    });

    it('Merge/override arrays', async function () {
      const actual = Objects.merge({ item1: [], item2: ['foo'] }, { item1: ['bar'], item2: ['bar'] });
      expect(actual).toEqual({ item1: ['bar'], item2: ['bar'] });
    });

    it('Override duplicates', async function () {
      const actual = Objects.merge({ item1: true, item2: false }, { item2: true });
      expect(actual).toEqual({ item1: true, item2: true });
    });

    it('Custom merge', async function () {
      const actual = Objects.merge(
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
