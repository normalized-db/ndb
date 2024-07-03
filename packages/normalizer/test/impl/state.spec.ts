import { describe, expect, it } from '@jest/globals';
import { normalizedDb } from '../../src/main';
import type { KeyTypes } from '../../src/types/normalizer-config-types';
import type { NormalizedDataTree } from '../../src/types/normalizer-types';
import { type AbstractDemoSchema, type DemoStructure, schemaConfig } from '../mock-data';

describe('v3/State', function () {

  describe('Merge trees', function () {

    it('Distinct trees', async function () {
      const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = state.mergeTrees(
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
      const actual = state.mergeTrees(
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
      const actual = state.mergeTrees(
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
      const { state } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = state.findEntityKeys(tree, 'role');
      expect(actual).toEqual(new Map([
        ['role', new Set(['admin', 'standard'])],
      ]));
    });

    it('Find leaf node by key', async function () {
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
