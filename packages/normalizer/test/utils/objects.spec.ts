import { describe, expect, it } from '@jest/globals';
import { normalizedDb } from '../../src/main';
import { Objects } from '../../src/utils/objects';
import { type AbstractDemoSchema, type DemoStructure, schemaConfig } from '../mock-data';

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

    describe('Merge recursively', function () {

      it('Distinct trees', async function () {
        const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
        const actual = Objects.merge(
          {
            role: { admin: { refs: { user: ['user1'] } } },
          },
          {
            user: { user1: { props: { role: 'admin' } } },
          },
        );

        expect(actual).toEqual({
          role: { admin: { refs: { user: ['user1'] } } },
          user: { user1: { props: { role: 'admin' } } },
        });
      });

      it('Overlapping types with distinct keys', async function () {
        const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
        const actual = Objects.merge(
          {
            role: {
              admin: { refs: { user: ['user1'] } },
            },
            user: {
              user1: { props: { role: 'admin' } },
            },
          },
          {
            role: {
              standard: { refs: { user: ['user2'] } },
            },
            user: {
              user2: { props: { role: 'standard' } },
            },
          },
        );

        expect(actual).toEqual({
          role: {
            admin: { refs: { user: ['user1'] } },
            standard: { refs: { user: ['user2'] } },
          },
          user: {
            user1: { props: { role: 'admin' } },
            user2: { props: { role: 'standard' } },
          },
        });
      });

      it('Overlapping with conflicting keys', async function () {
        const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
        const actual = Objects.merge(
          {
            blogPost: { 1: { props: { author: 'admin', comments: [1] } } },
          },
          {
            blogPost: { 1: { props: { author: 'standard', comments: [2] } } },
          },
        );

        expect(actual).toEqual({
          blogPost: { 1: { props: { author: 'standard', comments: [2] } } },
        });
      });

    });
  });
});
