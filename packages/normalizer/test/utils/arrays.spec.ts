import { describe, expect, it } from '@jest/globals';
import { Arrays } from '../../src/utils/arrays';

describe('Array Utils', function () {

  describe('Push distinct', function () {

    it('Duplicate value', async function () {
      const actual = Arrays.pushDistinct([1, 2], 1);
      expect(actual).toHaveProperty('items', [1, 2]);
      expect(actual).toHaveProperty('index', 0);
    });

    it('Duplicate value with custom equals', async function () {
      const actual = Arrays.pushDistinct([{ id: 1 }, { id: 2 }], { id: 2 }, (a, b) => a.id === b.id);
      expect(actual).toHaveProperty('items', ([{ id: 1 }, { id: 2 }]));
      expect(actual).toHaveProperty('index', 1);
    });

    it('Distinct value', async function () {
      const actual = Arrays.pushDistinct([1, 2], 3);
      expect(actual).toHaveProperty('items', ([1, 2, 3]));
      expect(actual).toHaveProperty('index', 2);
    });

    it('Distinct value with custom equals', async function () {
      const actual = Arrays.pushDistinct([{ id: 1 }, { id: 2 }], { id: 3 }, (a, b) => a.id === b.id);
      expect(actual).toHaveProperty('items', ([{ id: 1 }, { id: 2 }, { id: 3 }]));
      expect(actual).toHaveProperty('index', 2);
    });
  });

  describe('Upsert', function () {

    it('Duplicate value', async function () {
      const actual = Arrays.upsert([{ id: 1, value: 1 }, { id: 2, value: 2 }], { id: 2, value: 3 }, (a, b) => a.id === b.id);
      expect(actual).toHaveProperty('items', [{ id: 1, value: 1 }, { id: 2, value: 3 }]);
      expect(actual).toHaveProperty('index', 1);
    });

    it('Distinct value', async function () {
      const actual = Arrays.upsert([{ id: 1, value: 1 }, { id: 2, value: 2 }], { id: 3, value: 3 }, (a, b) => a.id === b.id);
      expect(actual).toHaveProperty('items', [{ id: 1, value: 1 }, { id: 2, value: 2 }, { id: 3, value: 3 }]);
      expect(actual).toHaveProperty('index', 2);
    });
  });

  describe('Merge', function () {

    it('Duplicate value', async function () {
      const actual = Arrays.mergePrimitive([1, 2], [1]);
      expect(actual).toEqual([1, 2]);
    });

    it('Duplicate value with custom equals', async function () {
      const actual = Arrays.merge([{ id: 1, value: 1 }, { id: 2, value: 2 }], [{ id: 2, value: 3 }], (a, b) => a.id === b.id);
      expect(actual).toEqual([{ id: 1, value: 1 }, { id: 2, value: 3 }]);
    });

    it('Distinct value', async function () {
      const actual = Arrays.mergePrimitive([1, 2], [3]);
      expect(actual).toEqual([1, 2, 3]);
    });

    it('Distinct value with custom equals', async function () {
      const actual = Arrays.merge([{ id: 1, value: 1 }, { id: 2, value: 2 }], [{ id: 3, value: 3 }], (a, b) => a.id === b.id);
      expect(actual).toEqual([{ id: 1, value: 1 }, { id: 2, value: 2 }, { id: 3, value: 3 }]);
    });
  });

});
