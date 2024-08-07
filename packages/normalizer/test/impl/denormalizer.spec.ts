import { describe, expect, it } from '@jest/globals';
import { normalizedDb } from '../../src/main';
import type { KeyTypes } from '../../src/types/normalizer-config-types';
import type { NormalizedData, NormalizedDataTree } from '../../src/types/normalizer-types';
import { type AbstractDemoSchema, type DemoStructure, type MockBlogPost, MockData, schemaConfig } from '../mock-data';

/**
 * This function actually loads the entire mock data objects, i.e., denormalization does not do anything
 * @param type
 * @param keys
 */
async function loadEntities(type: keyof DemoStructure, keys: KeyTypes[]) {
  switch (type) {
    case 'role':
      return [MockData.roleAdmin, MockData.roleUser].filter(d => keys.includes(d.id));
    case 'user':
      return [MockData.user1, MockData.user2].filter(d => keys.includes(d.userName));
    case 'blogPost':
      return [MockData.blogPost1, MockData.blogPost2].filter(d => keys.includes(d.id));
    case 'comment':
      return [MockData.blogPost1, MockData.blogPost2]
        .map(d => d.comments)
        .reduce((all, next) => all.concat(next), [])
        .filter(d => keys.includes(d.id));
    default:
      return [];
  }
}

describe('Denormalize', function () {

  const { denormalizer } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);

  describe('Preload', function () {
    it('Find and preload entities', async function () {
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

      const { denormalizer } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const { normalizedData: actual } = await denormalizer.preload(
        tree,
        'blogPost',
        loadEntities,
        {
          keys: 1,
          depth: { author: 0, comments: 0 },
        },
      );

      expect(actual).toHaveProperty('keyMap', {
        user: { user1: 0 },
        blogPost: { 1: 0 },
        comment: { 1: 0, 2: 1 },
      } satisfies NormalizedData<DemoStructure>['keyMap']);

      expect(actual).toHaveProperty('tree', tree);
      expect(actual).toHaveProperty('entities.user', [MockData.user1]);
      expect(actual).toHaveProperty('entities.blogPost', [MockData.blogPost1]);
      expect(actual).toHaveProperty('entities.comment', MockData.blogPost1.comments);
    });
  });

  it('Role', function () {
    const normalizedData: NormalizedData<DemoStructure> = {
      keyMap: { role: { admin: 0, standard: 1 } },
      tree: { role: { admin: {}, standard: {} } },
      entities: {
        role: [
          { id: 'admin', name: 'Admin' },
          { id: 'standard', name: 'Standard' },
        ],
      },
    };

    const typedDenormalizer = denormalizer.withData(normalizedData).ofType('role');
    const actual1 = typedDenormalizer.fromKey('admin');

    expect(actual1).toEqual(MockData.roleAdmin);

    const actual2 = typedDenormalizer.fromKeys(['standard']);
    expect(actual2).toHaveLength(1);
    expect(actual2).toContainEqual(MockData.roleUser);

    const actual3 = typedDenormalizer.all();
    expect(actual3).toHaveLength(2);
    expect(actual3).toContainEqual(MockData.roleAdmin);
    expect(actual3).toContainEqual(MockData.roleUser);
  });

  it('User', function () {
    const normalizedData: NormalizedData<DemoStructure> = {
      keyMap: {
        role: { admin: 0, standard: 1 },
        user: { user1: 0, user2: 1 },
      },
      tree: {
        role: {
          admin: { refs: { user: ['user1'] } },
          standard: { refs: { user: ['user2'] } },
        },
        user: {
          user1: { props: { role: 'admin' } },
          user2: { props: { role: 'standard' } },
        },
      },
      entities: {
        role: [
          { id: 'admin', name: 'Admin' },
          { id: 'standard', name: 'Standard' },
        ],
        user: [
          { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1' },
          { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2' },
        ],
      },
    };

    const [actual1, actual2] = denormalizer.withData(normalizedData)
      .ofType('user')
      .fromKeys(['user1', 'user2']);

    expect(actual1).toEqual(MockData.user1);
    expect(actual2).toEqual(MockData.user2);
  });

  describe('Blog Post', function () {
    const normalizedData: NormalizedData<DemoStructure> = {
      keyMap: {
        role: { admin: 0, standard: 1 },
        user: { user1: 0, user2: 1 },
        blogPost: { 1: 0 },
        comment: { 1: 0, 2: 1 },
      },
      tree: {
        role: {
          admin: { refs: { user: ['user1'] } },
          standard: { refs: { user: ['user2'] } },
        },
        user: {
          user1: { props: { role: 'admin' }, refs: { blogPost: [1], comment: [1] } },
          user2: { props: { role: 'standard' }, refs: { blogPost: [2], comment: [2, 3] } },
        },
        blogPost: {
          1: { props: { author: 'user1', comments: [1, 2] } },
          2: { props: { author: 'user2', comments: [3] } },
        },
        comment: {
          1: { props: { author: 'user1' }, refs: { blogPost: [1] } },
          2: { props: { author: 'user2' }, refs: { blogPost: [1] } },
          3: { props: { author: 'user2' }, refs: { blogPost: [2] } },
        },
      },
      entities: {
        role: [
          { id: 'admin', name: 'Admin' },
          { id: 'standard', name: 'Standard' },
        ],
        user: [
          { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1' },
          { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2' },
        ],
        blogPost: [
          { id: 1, title: 'Post 1' },
          { id: 2, title: 'Post 2' },
        ],
        comment: [
          { id: 1, text: 'Comment 1.1' },
          { id: 2, text: 'Comment 1.2' },
          { id: 3, text: 'Comment 2.1' },
        ],
      },
    };

    it('Blog post', function () {
      const actual1 = denormalizer.withData(normalizedData)
        .ofType('blogPost')
        .fromKey(1);
      expect(actual1).toEqual(MockData.blogPost1);
    });

    it('Blog post with numeric depth', function () {
      const actual = denormalizer.withData(normalizedData)
        .ofType('blogPost', { depth: 1 })
        .fromKey(1);

      expect(actual).toEqual({
        id: 1,
        title: 'Post 1',
        author: { ...MockData.user1, role: undefined } as any,
        comments: [
          { id: 1, text: 'Comment 1.1', author: undefined } as any,
          { id: 2, text: 'Comment 1.2', author: undefined },
        ],
      } satisfies MockBlogPost);
    });

    it('Blog post with property-specific depth', function () {
      const actual = denormalizer.withData(normalizedData)
        .ofType('blogPost', {
          depth: {
            author: 2,
            comments: { author: 0 },
          },
        })
        .fromKey(1);

      expect(actual).toEqual({
        id: 1,
        title: 'Post 1',
        author: MockData.user1,
        comments: [
          { id: 1, text: 'Comment 1.1', author: { ...MockData.user1, role: undefined } as any },
          { id: 2, text: 'Comment 1.2', author: { ...MockData.user2, role: undefined } },
        ],
      } satisfies MockBlogPost);
    });

  });

});
