import { describe, expect, it } from '@jest/globals';
import { configure } from '../src/v3/main';
import type { AbstractSchemaStructure, SchemaConfig, SchemaStructure } from '../src/v3/normalizer-config-types';
import type { NormalizedData, Schema } from '../src/v3/normalizer-types';

interface MockUserRole {
  readonly id: string;
  readonly name: string;
}

interface MockUser {
  readonly createdAt: Date;
  readonly name: string;
  readonly userName: string;
  readonly role: MockUserRole;
}

interface MockBlogPost {
  readonly id: number;
  readonly title: string;
  readonly author: MockUser;
  readonly comments: MockComment[];
}

interface MockComment {
  readonly id: number;
  readonly text: string;
  readonly author: MockUser;
}

namespace MockData {
  export const roleAdmin = { id: 'admin', name: 'Admin' };
  export const roleUser = { id: 'user', name: 'User' };
  export const user1: MockUser = {
    createdAt: new Date(),
    name: 'User 1',
    userName: 'user1',
    role: roleAdmin,
  };
  export const user2: MockUser = {
    createdAt: new Date(),
    name: 'User 2',
    userName: 'user2',
    role: roleUser,
  };
  export const blogPost1: MockBlogPost = {
    id: 1,
    title: 'Post 1',
    author: user1,
    comments: [
      { id: 1, text: 'Comment 1', author: user1 },
      { id: 2, text: 'Comment 2', author: user2 },
    ],
  };
}

describe('Schema/Normalizer v3', function () {

  interface DemoStructure extends SchemaStructure {
    role: MockUserRole;
    user: MockUser;
    blogPost: MockBlogPost;
    comment: MockComment;
  }

  interface AbstractDemoSchema extends AbstractSchemaStructure {
    baseAuthor: MockBlogPost & MockComment;
  }

  const schemaConfig: SchemaConfig<DemoStructure, AbstractDemoSchema> = {
    '@defaults': { key: 'id' },
    '@baseAuthor': {
      targets: { author: 'user' },
    },
    role: '@defaults',
    user: {
      key: 'userName',
      targets: { role: 'role' },
    },
    blogPost: {
      parent: '@baseAuthor',
      targets: {
        comments: {
          type: 'comment',
          isArray: true,
          dataStore: { cascadeRemoval: true },
        },
      },
    },
    comment: '@baseAuthor',
  };

  it('Build schema', function () {
    const { schema } = configure<DemoStructure, AbstractDemoSchema>(schemaConfig);
    expect(schema).toEqual({
      role: {
        key: 'id',
        targets: {},
        autoKey: false,
        logging: { mode: 'disabled' },
      },
      user: {
        key: 'userName',
        targets: {
          role: { type: 'role', isArray: false, cascadeRemoval: false },
        },
        autoKey: false,
        logging: { mode: 'disabled' },
      },
      blogPost: {
        key: 'id',
        targets: {
          author: { type: 'user', isArray: false, cascadeRemoval: false },
          comments: { type: 'comment', isArray: true, cascadeRemoval: true },
        },
        autoKey: false,
        logging: { mode: 'disabled' },
      },
      comment: {
        key: 'id',
        targets: {
          author: { type: 'user', isArray: false, cascadeRemoval: false },
        },
        autoKey: false,
        logging: { mode: 'disabled' },
      },
    } satisfies Schema<DemoStructure>);
  });

  describe('Normalize', function () {

    it('Role', async function () {
      const { normalize } = configure<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = await normalize('role', MockData.roleAdmin);
      expect(actual).toEqual({
        _keyMap: { role: new Map([['admin', 0]]) },
        role: [{ id: 'admin', name: 'Admin' }],
      });
    });

    it('User', async function () {
      const { normalize } = configure<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = await normalize('user', [MockData.user1, MockData.user2]);
      expect(actual).toHaveProperty('_keyMap', {
        role: new Map([['admin', 0], ['user', 1]]),
        user: new Map([['user1', 0], ['user2', 1]]),
      });
      expect(actual).toHaveProperty('role', [
        { id: 'admin', name: 'Admin' },
        { id: 'user', name: 'User' },
      ]);
      expect(actual).toHaveProperty('user', [
        { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin' },
        { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'user' },
      ]);
    });

    it('User with Reverse References', async function () {
      const { normalize } = configure<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = await normalize('user', [MockData.user1, MockData.user2], { reverseRefs: true });
      expect(actual).toHaveProperty('_keyMap', {
        role: new Map([['admin', 0], ['user', 1]]),
        user: new Map([['user1', 0], ['user2', 1]]),
      });
      expect(actual).toHaveProperty('role', [
        { id: 'admin', name: 'Admin', _refs: { user: new Set(['user1']) } },
        { id: 'user', name: 'User', _refs: { user: new Set(['user2']) } },
      ]);
      expect(actual).toHaveProperty('user', [
        { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin' },
        { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'user' },
      ]);
    });

    it('Blog Post with Reverse References', async function () {
      const { normalize } = configure<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const actual = await normalize('blogPost', [MockData.blogPost1], { reverseRefs: true });
      expect(actual).toHaveProperty('_keyMap', {
        role: new Map([['admin', 0], ['user', 1]]),
        user: new Map([['user1', 0], ['user2', 1]]),
        blogPost: new Map([[1, 0]]),
        comment: new Map([[1, 0], [2, 1]]),
      });
      expect(actual).toHaveProperty('role', [
        { id: 'admin', name: 'Admin', _refs: { user: new Set(['user1']) } },
        { id: 'user', name: 'User', _refs: { user: new Set(['user2']) } },
      ]);
      expect(actual).toHaveProperty('user', [
        {
          createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin',
          _refs: { blogPost: new Set([1]), comment: new Set([1]) },
        },
        {
          createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'user',
          _refs: { comment: new Set([2]) },
        },
      ]);
      expect(actual).toHaveProperty('blogPost', [
        { id: 1, title: 'Post 1', author: 'user1', comments: [1, 2] },
      ]);
      expect(actual).toHaveProperty('comment', [
        { id: 1, text: 'Comment 1', author: 'user1', _refs: { blogPost: new Set([1]) } },
        { id: 2, text: 'Comment 2', author: 'user2', _refs: { blogPost: new Set([1]) } },
      ]);
    });

  });

  describe('Denormalize', function () {

    it('Role', async function () {
      const { denormalizer } = configure<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const normalizedData: NormalizedData<DemoStructure> = {
        _keyMap: {
          role: new Map([['admin', 0], ['user', 1]]),
        },
        role: [
          { id: 'admin', name: 'Admin' },
          { id: 'user', name: 'User' },
        ],
      };
      const typedDenormalizer = denormalizer(normalizedData, 'role');
      const actual1 = await typedDenormalizer.fromData({ id: 'admin', name: 'Admin' });
      const actual2 = await typedDenormalizer.fromKey('admin');
      const actual3 = await typedDenormalizer.fromKey('user');

      expect(actual1).toEqual(MockData.roleAdmin);
      expect(actual2).toEqual(MockData.roleAdmin);
      expect(actual3).toEqual(MockData.roleUser);
    });

    it('User', async function () {
      const { denormalizer } = configure<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const normalizedData: NormalizedData<DemoStructure> = {
        _keyMap: {
          role: new Map([['admin', 0], ['user', 1]]),
          user: new Map([['user1', 0], ['user2', 1]]),
        },
        role: [
          { id: 'admin', name: 'Admin', _refs: { user: new Set(['user1']) } },
          { id: 'user', name: 'User', _refs: { user: new Set(['user2']) } },
        ],
        user: [
          { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin' } as any as MockUser,
          { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'user' } as any as MockUser,
        ],
      };
      const typedDenormalizer = denormalizer(normalizedData, 'user', { reverseRefsDeleted: true });
      const actual1 = await typedDenormalizer.fromKey('user1');
      const actual2 = await typedDenormalizer.fromKey('user2');

      expect(actual1).toEqual(MockData.user1);
      expect(actual2).toEqual(MockData.user2);
    });

    it('Blog post', async function () {
      const { denormalizer } = configure<DemoStructure, AbstractDemoSchema>(schemaConfig);
      const normalizedData: NormalizedData<DemoStructure> = {
        _keyMap: {
          role: new Map([['admin', 0], ['user', 1]]),
          user: new Map([['user1', 0], ['user2', 1]]),
          blogPost: new Map([[1, 0]]),
          comment: new Map([[1, 0], [2, 1]]),
        },
        role: [
          { id: 'admin', name: 'Admin', _refs: { user: new Set(['user1']) } },
          { id: 'user', name: 'User', _refs: { user: new Set(['user2']) } },
        ],
        user: [
          {
            createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin' as any as MockUserRole,
            _refs: { blogPost: new Set([1]), comment: new Set([1]) },
          },
          {
            createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'user' as any as MockUserRole,
            _refs: { comment: new Set([2]) },
          },
        ],
        blogPost: [
          { id: 1, title: 'Post 1', author: 'user1' as any as MockUser, comments: [1, 2] as any as MockComment[] },
        ],
        comment: [
          { id: 1, text: 'Comment 1', author: 'user1' as any as MockUser, _refs: { blogPost: new Set([1]) } },
          { id: 2, text: 'Comment 2', author: 'user2' as any as MockUser, _refs: { blogPost: new Set([1]) } },
        ],
      };
      const typedDenormalizer = denormalizer(normalizedData, 'blogPost', { reverseRefsDeleted: true });
      const actual1 = await typedDenormalizer.fromKey(1);

      expect(actual1).toEqual(MockData.blogPost1);
    });

  });

});
