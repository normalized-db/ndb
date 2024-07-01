import type { AbstractSchemaStructure, SchemaConfig, SchemaStructure } from '../../src/v3/normalizer-config-types';

export interface MockUserRole {
  readonly id: string;
  readonly name: string;
}

export interface MockUser {
  readonly createdAt: Date;
  readonly name: string;
  readonly userName: string;
  readonly role: MockUserRole;
}

export interface MockBlogPost {
  readonly id: number;
  readonly title: string;
  readonly author: MockUser;
  readonly comments: MockComment[];
}

export interface MockComment {
  readonly id: number;
  readonly text: string;
  readonly author: MockUser;
}

export interface DemoStructure extends SchemaStructure {
  role: MockUserRole;
  user: MockUser;
  blogPost: MockBlogPost;
  comment: MockComment;
}

export interface AbstractDemoSchema extends AbstractSchemaStructure {
  baseAuthor: MockBlogPost & MockComment;
}

export const schemaConfig: SchemaConfig<DemoStructure, AbstractDemoSchema> = {
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

export namespace MockData {
  export const roleAdmin = { id: 'admin', name: 'Admin' };
  export const roleUser = { id: 'standard', name: 'Standard' };
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
      { id: 1, text: 'Comment 1.1', author: user1 },
      { id: 2, text: 'Comment 1.2', author: user2 },
    ],
  };
  export const blogPost2: MockBlogPost = {
    id: 2,
    title: 'Post 2',
    author: user2,
    comments: [
      { id: 3, text: 'Comment 2.1', author: user1 },
    ],
  };
}
