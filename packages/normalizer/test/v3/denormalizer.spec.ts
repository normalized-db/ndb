import { describe, expect, it } from '@jest/globals';
import { normalizedDb } from '../../src/v3/main';
import type { NormalizedData } from '../../src/v3/normalizer-types';
import {
  type AbstractDemoSchema,
  type DemoStructure,
  type MockComment,
  MockData,
  type MockUser,
  type MockUserRole,
  schemaConfig,
} from './mock-data';

describe('v3/Denormalize', function () {

  const { denormalizer } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);

  it('Role', function () {
    const normalizedData: NormalizedData<DemoStructure> = {
      keyMap: { role: new Map([['admin', 0], ['standard', 1]]) },
      tree: {},
      entities: {
        role: [
          { id: 'admin', name: 'Admin' },
          { id: 'standard', name: 'Standard' },
        ],
      },
    };

    const typedDenormalizer = denormalizer.fromData(normalizedData).ofType('role');
    const actual1 = typedDenormalizer.fromKey('admin');
    const actual2 = typedDenormalizer.fromKey('standard');

    expect(actual1).toEqual(MockData.roleAdmin);
    expect(actual2).toEqual(MockData.roleUser);
  });

  it('User', function () {
    const normalizedData: NormalizedData<DemoStructure> = {
      keyMap: {
        role: new Map([['admin', 0], ['standard', 1]]),
        user: new Map([['user1', 0], ['user2', 1]]),
      },
      tree: {},
      entities: {
        role: [
          { id: 'admin', name: 'Admin', _refs: { user: new Set(['user1']) } },
          { id: 'standard', name: 'Standard', _refs: { user: new Set(['user2']) } },
        ],
        user: [
          { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin' } as any as MockUser,
          { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'standard' } as any as MockUser,
        ],
      },
    };

    const [actual1, actual2] = denormalizer.fromData(normalizedData)
      .ofType('user', { reverseRefsDeleted: true })
      .fromKeys(['user1', 'user2']);

    expect(actual1).toEqual(MockData.user1);
    expect(actual2).toEqual(MockData.user2);
  });

  describe('Blog Post', function () {
    const normalizedData: NormalizedData<DemoStructure> = {
      keyMap: {
        role: new Map([['admin', 0], ['standard', 1]]),
        user: new Map([['user1', 0], ['user2', 1]]),
        blogPost: new Map([[1, 0]]),
        comment: new Map([[1, 0], [2, 1]]),
      },
      tree: {},
      entities: {
        role: [
          { id: 'admin', name: 'Admin', _refs: { user: new Set(['user1']) } },
          { id: 'standard', name: 'Standard', _refs: { user: new Set(['user2']) } },
        ],
        user: [
          {
            createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin' as any as MockUserRole,
            _refs: { blogPost: new Set([1]), comment: new Set([1]) },
          },
          {
            createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'standard' as any as MockUserRole,
            _refs: { comment: new Set([2]) },
          },
        ],
        blogPost: [
          { id: 1, title: 'Post 1', author: 'user1' as any as MockUser, comments: [1, 2] as any as MockComment[] },
          { id: 2, title: 'Post 2', author: 'user2' as any as MockUser, comments: [3] as any as MockComment[] },
        ],
        comment: [
          { id: 1, text: 'Comment 1.1', author: 'user1' as any as MockUser, _refs: { blogPost: new Set([1]) } },
          { id: 2, text: 'Comment 1.2', author: 'user2' as any as MockUser, _refs: { blogPost: new Set([1]) } },
          { id: 3, text: 'Comment 2.1', author: 'user2' as any as MockUser, _refs: { blogPost: new Set([2]) } },
        ],
      },
    };

    it('Blog post', function () {
      const actual1 = denormalizer.fromData(normalizedData)
        .ofType('blogPost', { reverseRefsDeleted: true })
        .fromKey(1);
      expect(actual1).toEqual(MockData.blogPost1);
    });

    it('Blog post with numeric depth', function () {
      const actual = denormalizer.fromData(normalizedData)
        .ofType('blogPost', { reverseRefsDeleted: true, depth: 1 })
        .fromKey(1);

      expect(actual).toEqual({
        id: 1,
        title: 'Post 1',
        author: { ...MockData.user1, role: MockData.user1.role.id },
        comments: [
          { id: 1, text: 'Comment 1.1', author: MockData.user1.userName },
          { id: 2, text: 'Comment 1.2', author: MockData.user2.userName },
        ],
      });
    });

    it('Blog post with property-specific depth', function () {
      const actual = denormalizer.fromData(normalizedData)
        .ofType('blogPost', {
          reverseRefsDeleted: true,
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
          { id: 1, text: 'Comment 1.1', author: { ...MockData.user1, role: MockData.user1.role.id } },
          { id: 2, text: 'Comment 1.2', author: { ...MockData.user2, role: MockData.user2.role.id } },
        ],
      });
    });

  });

});
