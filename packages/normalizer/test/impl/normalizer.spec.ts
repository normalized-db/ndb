import { describe, expect, it } from '@jest/globals';
import { normalizedDb } from '../../src/main';
import type { KeyTypes } from '../../src/types/normalizer-config-types';
import type { NormalizedData } from '../../src/types/normalizer-types';
import { type AbstractDemoSchema, type DemoStructure, MockData, schemaConfig } from '../mock-data';

describe('v3/Normalize', function () {

  it('Role', function () {
    const { normalize } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
    const actual = normalize('role', MockData.roleAdmin);
    expect(actual).toHaveProperty('keyMap', {
      role: new Map([['admin', 0]]),
    });
    expect(actual).toHaveProperty('tree', {
      role: new Map([['admin', undefined]]),
    });
    expect(actual).toHaveProperty('entities.role', [
      { id: 'admin', name: 'Admin' },
    ]);
  });

  it('User', function () {
    const { normalize } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
    const actual = normalize('user', [MockData.user1, MockData.user2], { uniqueKeyCallback: type => 1 });
    expect(actual).toHaveProperty('keyMap', {
      role: new Map([['admin', 0], ['standard', 1]]),
      user: new Map([['user1', 0], ['user2', 1]]),
    });
    expect(actual).toHaveProperty('tree', {
      role: new Map([['admin', undefined], ['standard', undefined]]),
      user: new Map([
        ['user1', new Map([['role', 'admin']])],
        ['user2', new Map([['role', 'standard']])],
      ]),
    });
    expect(actual).toHaveProperty('entities.role', [
      { id: 'admin', name: 'Admin' },
      { id: 'standard', name: 'Standard' },
    ]);
    expect(actual).toHaveProperty('entities.user', [
      { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin' },
      { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'standard' },
    ]);
  });

  it('User with Reverse References', function () {
    const { normalize } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
    const actual = normalize('user', [MockData.user1, MockData.user2], { reverseRefs: true });
    expect(actual).toHaveProperty('keyMap', {
      role: new Map([['admin', 0], ['standard', 1]]),
      user: new Map([['user1', 0], ['user2', 1]]),
    });
    expect(actual).toHaveProperty('entities.role', [
      { id: 'admin', name: 'Admin', _refs: { user: new Set(['user1']) } },
      { id: 'standard', name: 'Standard', _refs: { user: new Set(['user2']) } },
    ]);
    expect(actual).toHaveProperty('entities.user', [
      { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin' },
      { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'standard' },
    ]);
  });

  it('Blog Post with Reverse References', function () {
    const { normalize } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
    const actual = normalize('blogPost', [MockData.blogPost1], { reverseRefs: true });
    expect(actual).toHaveProperty('keyMap', {
      role: new Map([['admin', 0], ['standard', 1]]),
      user: new Map([['user1', 0], ['user2', 1]]),
      blogPost: new Map([[1, 0]]),
      comment: new Map([[1, 0], [2, 1]]),
    });
    expect(actual).toHaveProperty('tree', {
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
      ]),
      comment: new Map([
        [1, new Map([['author', 'user1']])],
        [2, new Map([['author', 'user2']])],
      ]),
    } satisfies NormalizedData<DemoStructure>['tree']);
    expect(actual).toHaveProperty('entities.role', [
      { id: 'admin', name: 'Admin', _refs: { user: new Set(['user1']) } },
      { id: 'standard', name: 'Standard', _refs: { user: new Set(['user2']) } },
    ]);
    expect(actual).toHaveProperty('entities.user', [
      {
        createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1', role: 'admin',
        _refs: { blogPost: new Set([1]), comment: new Set([1]) },
      },
      {
        createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2', role: 'standard',
        _refs: { comment: new Set([2]) },
      },
    ]);
    expect(actual).toHaveProperty('entities.blogPost', [
      { id: 1, title: 'Post 1', author: 'user1', comments: [1, 2] },
    ]);
    expect(actual).toHaveProperty('entities.comment', [
      { id: 1, text: 'Comment 1.1', author: 'user1', _refs: { blogPost: new Set([1]) } },
      { id: 2, text: 'Comment 1.2', author: 'user2', _refs: { blogPost: new Set([1]) } },
    ]);
  });

});
