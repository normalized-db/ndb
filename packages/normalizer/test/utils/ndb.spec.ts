import { describe, expect, it } from '@jest/globals';
import { buildSchema } from '../../src/impl/schema';
import type { KeyTypes } from '../../src/types/normalizer-config-types';
import type { Depth, NormalizedDataTree } from '../../src/types/normalizer-types';
import { Ndb } from '../../src/utils/ndb';
import { type DemoStructure, type MockBlogPost, schemaConfig } from '../mock-data';

describe('NDB Utils', function () {

  const schema = buildSchema(schemaConfig);

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
      const actual = Ndb.findEntityKeys(schema, tree, 'role');
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin', 'standard'])],
      ]));
    });

    it('Find leaf node by key', async function () {
      const actual = Ndb.findEntityKeys(schema, tree, 'role', { keys: 'admin' });
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin'])],
      ]));
    });

    it('Find nodes recursively', async function () {
      const actual = Ndb.findEntityKeys(schema, tree, 'user', { keys: 'user1' });
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin'])],
        ['user', new Set(['user1'])],
      ]));
    });

    it('Find more nodes recursively', async function () {
      const actual1 = Ndb.findEntityKeys(schema, tree, 'blogPost', { keys: 1 });
      expect(actual1).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['role', new Set(['admin', 'standard'])],
        ['user', new Set(['user1', 'user2'])],
        ['blogPost', new Set([1])],
        ['comment', new Set([1, 2])],
      ]));

      const actual2 = Ndb.findEntityKeys(schema, tree, 'blogPost', { keys: 2 });
      expect(actual2).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['role', new Set(['standard'])],
        ['user', new Set(['user2'])],
        ['blogPost', new Set([2])],
        ['comment', new Set([3])],
      ]));
    });

    it('Find more nodes with property-specific depth (1)', function () {
      const actual = Ndb.findEntityKeys(schema, tree, 'blogPost', {
        keys: 1,
        depth: {
          author: 2,
          comments: { author: 0 },
        },
      });

      expect(actual).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['role', new Set(['admin'])],
        ['user', new Set(['user1', 'user2'])],
        ['blogPost', new Set([1])],
        ['comment', new Set([1, 2])],
      ]));
    });

    it('Find more nodes with property-specific depth (2)', function () {
      const actual = Ndb.findEntityKeys(schema, tree, 'blogPost', {
        keys: 1,
        depth: {
          author: 1,
          comments: 0,
        },
      });

      expect(actual).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['role', new Set(['admin'])],
        ['user', new Set(['user1'])],
        ['blogPost', new Set([1])],
        ['comment', new Set([1, 2])],
      ]));
    });

    it('Find more nodes with property-specific depth (3)', function () {
      const actual = Ndb.findEntityKeys(schema, tree, 'blogPost', {
        keys: 1,
        depth: { author: 0, comments: 0 },
      });

      expect(actual).toEqual(new Map<keyof DemoStructure, Set<KeyTypes>>([
        ['user', new Set(['user1'])],
        ['blogPost', new Set([1])],
        ['comment', new Set([1, 2])],
      ]));
    });

  });

  describe('Depth', function () {

    it('Get next depth', function () {
      expect(Ndb.nextDepth<MockBlogPost>(3, 'author')).toEqual(2);
      expect(Ndb.nextDepth<MockBlogPost>({ author: 1 }, 'author')).toEqual(1);
      expect(Ndb.nextDepth<MockBlogPost>({ author: 1 }, 'comments')).toEqual(0);
      expect(Ndb.nextDepth<MockBlogPost>(undefined, 'author')).toBeUndefined();
    });

    it('Is done', function () {
      expect(Ndb.isDone<MockBlogPost>(undefined)).toBeFalsy();
      expect(Ndb.isDone<MockBlogPost>(2)).toBeFalsy();
      expect(Ndb.isDone<MockBlogPost>({ author: 1 })).toBeFalsy();
      expect(Ndb.isDone<MockBlogPost>({ author: 0 })).toBeFalsy();
      expect(Ndb.isDone<MockBlogPost>(0)).toBeTruthy();
    });

  });

});
