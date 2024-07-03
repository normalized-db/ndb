import { describe, expect, it } from '@jest/globals';
import { normalizedDb } from '../../src/main';
import type { NormalizedData } from '../../src/types/normalizer-types';
import { type AbstractDemoSchema, type DemoStructure, MockData, schemaConfig } from '../mock-data';

describe('v3/Normalize', function () {

  it('Role', function () {
    const { normalize } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
    const actual = normalize('role', MockData.roleAdmin);

    expect(actual).toHaveProperty('keyMap', {
      role: { admin: 0 },
    } satisfies NormalizedData<DemoStructure>['keyMap']);

    expect(actual).toHaveProperty('tree', {
      role: { admin: {} },
    } satisfies NormalizedData<DemoStructure>['tree']);

    expect(actual).toHaveProperty('entities.role', [
      { id: 'admin', name: 'Admin' },
    ] satisfies NormalizedData<DemoStructure>['entities']['role']);
  });

  it('User', function () {
    const { normalize } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
    const actual = normalize('user', [MockData.user1, MockData.user2], { uniqueKeyCallback: type => 1 });

    expect(actual).toHaveProperty('keyMap', {
      role: { admin: 0, standard: 1 },
      user: { user1: 0, user2: 1 },
    } satisfies NormalizedData<DemoStructure>['keyMap']);

    expect(actual).toHaveProperty('tree', {
      role: {
        admin: { refs: { user: ['user1'] } },
        standard: { refs: { user: ['user2'] } },
      },
      user: {
        user1: { props: { role: 'admin' } },
        user2: { props: { role: 'standard' } },
      },
    } satisfies NormalizedData<DemoStructure>['tree']);

    expect(actual).toHaveProperty('entities.role', [
      { id: 'admin', name: 'Admin' },
      { id: 'standard', name: 'Standard' },
    ] satisfies NormalizedData<DemoStructure>['entities']['role']);

    expect(actual).toHaveProperty('entities.user', [
      { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1' },
      { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2' },
    ] satisfies NormalizedData<DemoStructure>['entities']['user']);
  });

  it('Blog Post', function () {
    const { normalize } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
    const actual = normalize('blogPost', [MockData.blogPost1]);

    expect(actual).toHaveProperty('keyMap', {
      role: { admin: 0, standard: 1 },
      user: { user1: 0, user2: 1 },
      blogPost: { 1: 0 },
      comment: { 1: 0, 2: 1 },
    } satisfies NormalizedData<DemoStructure>['keyMap']);

    expect(actual).toHaveProperty('tree', {
      role: {
        admin: { refs: { user: ['user1'] } },
        standard: { refs: { user: ['user2'] } },
      },
      user: {
        user1: { props: { role: 'admin' }, refs: { blogPost: [1], comment: [1] } },
        user2: { props: { role: 'standard' }, refs: { comment: [2] } },
      },
      blogPost: {
        1: { props: { author: 'user1', comments: [1, 2] } },
      },
      comment: {
        1: { props: { author: 'user1' }, refs: { blogPost: [1] } },
        2: { props: { author: 'user2' }, refs: { blogPost: [1] } },
      },
    } satisfies NormalizedData<DemoStructure>['tree']);

    expect(actual).toHaveProperty('entities.role', [
      { id: 'admin', name: 'Admin' },
      { id: 'standard', name: 'Standard' },
    ] satisfies NormalizedData<DemoStructure>['entities']['role']);

    expect(actual).toHaveProperty('entities.user', [
      { createdAt: MockData.user1.createdAt, userName: 'user1', name: 'User 1' },
      { createdAt: MockData.user2.createdAt, userName: 'user2', name: 'User 2' },
    ] satisfies NormalizedData<DemoStructure>['entities']['user']);

    expect(actual).toHaveProperty('entities.blogPost', [
      { id: 1, title: 'Post 1' },
    ] satisfies NormalizedData<DemoStructure>['entities']['blogPost']);

    expect(actual).toHaveProperty('entities.comment', [
      { id: 1, text: 'Comment 1.1' },
      { id: 2, text: 'Comment 1.2' },
    ] satisfies NormalizedData<DemoStructure>['entities']['comment']);
  });

});
