import { describe, expect, it } from '@jest/globals';
import { normalizedDb } from '../../src/v3/main';
import type { KeyTypes } from '../../src/v3/normalizer-config-types';
import type { NormalizedDataTree } from '../../src/v3/normalizer-types';
import { type AbstractDemoSchema, type DemoStructure, schemaConfig } from './mock-data';

describe('v3/State', function () {

  describe('Merge trees', function () {

    it('Distinct trees', async function () {
      const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = state.mergeTrees(
        {
          role: new Map([['admin', undefined]]),
        },
        {
          user: new Map([['user1', new Map([['role', 'admin']])]]),
        },
      );

      expect(actual).toEqual({
        role: new Map([['admin', undefined]]),
        user: new Map([['user1', new Map([['role', 'admin']])]]),
      });
    });

    it('Overlapping types with distinct keys', async function () {
      const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = state.mergeTrees(
        {
          role: new Map([['admin', undefined]]),
          user: new Map([['user1', new Map([['role', 'admin']])]]),
        },
        {
          role: new Map([['standard', undefined]]),
          user: new Map([['user2', new Map([['role', 'standard']])]]),
        },
      );

      expect(actual).toEqual({
        role: new Map([['admin', undefined], ['standard', undefined]]),
        user: new Map([
          ['user1', new Map([['role', 'admin']])],
          ['user2', new Map([['role', 'standard']])],
        ]),
      });
    });

    it('Overlapping with conflicting keys', async function () {
      const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = state.mergeTrees(
        {
          blogPost: new Map([
            [1, new Map<keyof DemoStructure['blogPost'], KeyTypes | Set<KeyTypes>>([
              ['author', 'admin'],
              ['comments', new Set([1])],
            ])],
          ]),
        },
        {
          blogPost: new Map([
            [1, new Map<keyof DemoStructure['blogPost'], KeyTypes | Set<KeyTypes>>([
              ['author', 'standard'],
              ['comments', new Set([2])],
            ])],
          ]),
        },
      );

      expect(actual).toEqual({
        blogPost: new Map([
          [1, new Map<keyof DemoStructure['blogPost'], KeyTypes | Set<KeyTypes>>([
            ['author', 'standard'],
            ['comments', new Set([1, 2])],
          ])],
        ]),
      });
    });

  });

  describe('Find entity keys', function () {

    const tree: NormalizedDataTree<DemoStructure> = {
      role: new Map([['admin', undefined], ['standard', undefined]]),
      user: new Map([
        ['user1', new Map([['role', 'admin']])],
        ['user2', new Map([['role', 'standard']])],
      ]),
      blogPost: new Map([
        [1, new Map<keyof DemoStructure['blogPost'], KeyTypes | Set<KeyTypes>>([
          ['author', 'user1'],
          ['comments', new Set([1, 2])],
        ])],
        [2, new Map<keyof DemoStructure['blogPost'], KeyTypes | Set<KeyTypes>>([
          ['author', 'user2'],
          ['comments', new Set([3])],
        ])],
      ]),
      comment: new Map([
        [1, new Map([['author', 'user2']])],
        [2, new Map([['author', 'user1']])],
        [3, new Map([['author', 'user2']])],
      ]),
    };

    it('Find leave node', async function () {
      const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = state.findEntityKeys(tree, 'role');
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin', 'standard'])],
      ]));
    });

    it('Find leave node by key', async function () {
      const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = state.findEntityKeys(tree, 'role', 'admin');
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin'])],
      ]));
    });

    it('Find nodes recursively', async function () {
      const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = state.findEntityKeys(tree, 'user', 'user1');
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin'])],
        ['user', new Set(['user1'])],
      ]));
    });

    it('Find more nodes recursively', async function () {
      const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual1 = state.findEntityKeys(tree, 'blogPost', 1);
      expect(actual1).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['role', new Set(['admin', 'standard'])],
        ['user', new Set(['user1', 'user2'])],
        ['blogPost', new Set([1])],
        ['comment', new Set([1, 2])],
      ]));
      const actual2 = state.findEntityKeys(tree, 'blogPost', 2);
      expect(actual2).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['role', new Set(['standard'])],
        ['user', new Set(['user2'])],
        ['blogPost', new Set([2])],
        ['comment', new Set([3])],
      ]));
    });

  });

});
