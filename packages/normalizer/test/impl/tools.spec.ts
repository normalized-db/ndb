import { describe, expect, it } from '@jest/globals';
import { normalizedDb } from '../../src/main';
import type { KeyTypes } from '../../src/types/normalizer-config-types';
import type { NormalizedDataTree } from '../../src/types/normalizer-types';
import { type AbstractDemoSchema, type DemoStructure, schemaConfig } from '../mock-data';

describe('Tools', function () {

  describe('Find entity keys', function () {

    const tree: NormalizedDataTree<DemoStructure> = {
      role: {
        admin: { refs: { user: ['user1'] } },
        standard: { refs: { user: ['user2'] } },
      },
      user: {
        user1: { props: { role: 'admin' }, refs: { blogPost: [1], comment: [2, 3] } },
        user2: { props: { role: 'standard' }, refs: { blogPost: [2], comment: [1] } },
      },
      blogPost: {
        1: { props: { author: 'user1', comments: [1, 2] } },
        2: { props: { author: 'user2', comments: [3] } },
      },
      comment: {
        1: { props: { author: 'user2' }, refs: { blogPost: [1] } },
        2: { props: { author: 'user1' }, refs: { blogPost: [1] } },
        3: { props: { author: 'user2' }, refs: { blogPost: [2] } },
      },
    };

    it('Find leaf node', async function () {
      const { tools } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = tools.findEntityKeys(tree, 'role');
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin', 'standard'])],
      ]));
    });

    it('Find leaf node by key', async function () {
      const { tools } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = tools.findEntityKeys(tree, 'role', { rootKeys: 'admin' });
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin'])],
      ]));
    });

    it('Find nodes recursively', async function () {
      const { tools } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = tools.findEntityKeys(tree, 'user', { rootKeys: 'user1' });
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin'])],
        ['user', new Set(['user1'])],
      ]));
    });

    it('Find more nodes recursively', async function () {
      const { tools } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual1 = tools.findEntityKeys(tree, 'blogPost', { rootKeys: 1 });
      expect(actual1).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['role', new Set(['admin', 'standard'])],
        ['user', new Set(['user1', 'user2'])],
        ['blogPost', new Set([1])],
        ['comment', new Set([1, 2])],
      ]));

      const actual2 = tools.findEntityKeys(tree, 'blogPost', { rootKeys: 2 });
      expect(actual2).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['role', new Set(['standard'])],
        ['user', new Set(['user2'])],
        ['blogPost', new Set([2])],
        ['comment', new Set([3])],
      ]));
    });

    it('Find more nodes with property-specific depth (1)', function () {
      const { tools } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = tools.findEntityKeys(tree, 'blogPost', {
        rootKeys: 1,
        depth: {
          author: 2,
          comments: { author: 0 },
        },
      });

      expect(actual).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['role', new Set(['admin'])],
        ['user', new Set(['user1'])],
        ['blogPost', new Set([1])],
        ['comment', new Set([1, 2])],
      ]));
    });

    it('Find more nodes with property-specific depth (2)', function () {
      const { tools } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = tools.findEntityKeys(tree, 'blogPost', {
        rootKeys: 1,
        depth: {
          author: 1,
          comments: { author: 1 },
        },
      });

      expect(actual).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['user', new Set(['user1', 'user2'])],
        ['blogPost', new Set([1])],
        ['comment', new Set([1, 2])],
      ]));
    });

  });

});
