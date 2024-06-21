import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { deepClone, Depth, ISchemaConfig } from '../src/core';
import { Denormalizer, DenormalizerBuilder } from '../src/denormalizer';
import * as Blog from './data/blog-post';
import * as User from './data/user';

describe('Denormalizer', function () {

  let schemaConfig: ISchemaConfig;
  let denormalizer: Denormalizer;
  let expected: any;
  let data: any;
  let normalizedData: any;

  async function test(rootEntity: string, depth?: number | Depth): Promise<void> {
    const result = Array.isArray(data)
      ? await denormalizer.applyAll(rootEntity, data, depth)
      : await denormalizer.apply(rootEntity, data, depth);

    expect(result).toEqual(expected);
  }

  afterEach(async function () {
    schemaConfig = null;
    denormalizer = null;
    data = null;
    expected = null;
    normalizedData = null;
  });

  describe('Invalid types', function () {

    beforeEach(async function () {
      schemaConfig = User.SCHEMA;
      denormalizer = new DenormalizerBuilder()
        .schemaConfig(schemaConfig)
        .normalizedData({ 'user': [] })
        .build();
    });

    it('Apply all', async function () {
      await expect(denormalizer.applyAll('user', [])).resolves.toEqual([]);
      await expect(denormalizer.applyAll('invalid', []))
        .rejects.toEqual(new Error('Type "invalid" is not configured'));
    });

    it('Apply', async function () {
      await expect(denormalizer.apply('user', {})).resolves.toEqual({});
      await expect(denormalizer.apply('invalid', {}))
        .rejects.toEqual(new Error('Type "invalid" is not configured'));
    });

    it('Apply key', async function () {
      await expect(denormalizer.applyKey('user', 0))
        .rejects.toEqual(new Error('Could not find "user" with key "0"'));
      await expect(denormalizer.applyKey('invalid', 0))
        .rejects.toEqual(new Error('Type "invalid" is not configured'));
    });
  });

  describe('Users', function () {

    beforeEach(async function () {
      schemaConfig = User.SCHEMA;
      normalizedData = deepClone(User.DATA_NORMALIZED);
      expected = deepClone(User.DATA);
      denormalizer = new DenormalizerBuilder()
        .schemaConfig(schemaConfig)
        .normalizedData(normalizedData)
        .build();
    });

    it('Single Item', async function () {
      data = normalizedData.user[0];
      expected = expected[0];
      await test('user');
    });

    it('Single Item - by Key', async function () {
      expected = expected[0];
      const result = await denormalizer.applyKey('user', 1);
      expect(result).toEqual(expected);
    });

    it('Collection', async function () {
      data = normalizedData.user;
      await test('user');
    });

    it('Collection - Depth(0)', async function () {
      data = deepClone(normalizedData.user);
      expected = normalizedData.user;
      await test('user', 0);
    });

    it('Reverse references', async function () {
      normalizedData = deepClone(User.DATA_NORMALIZED_RR);
      denormalizer = new DenormalizerBuilder()
        .schemaConfig(schemaConfig)
        .normalizedData(normalizedData)
        .reverseRefsDeleted(true)
        .build();
      data = normalizedData.user;
      await test('user');
    });

    it('Reverse references - Keep', async function () {
      normalizedData = deepClone(User.DATA_NORMALIZED_RR);
      denormalizer = new DenormalizerBuilder()
        .schemaConfig(schemaConfig)
        .normalizedData(normalizedData)
        .build();

      data = normalizedData.user;

      expected[0].role = User.reverseRole(expected[0].role, [User.USER1]);
      expected[1].role = User.reverseRole(expected[1].role, [User.USER2, User.USER3]);
      expected[2].role = User.reverseRole(expected[2].role, [User.USER2, User.USER3]);

      await test('user');
    });
  });

  describe('Blog Posts', function () {

    beforeEach(async function () {
      schemaConfig = Blog.SCHEMA;
      normalizedData = deepClone(Blog.DATA_NORMALIZED);
      expected = deepClone(Blog.DATA);
      denormalizer = new DenormalizerBuilder()
        .schemaConfig(schemaConfig)
        .normalizedData(normalizedData)
        .build();
    });

    it('Single Item', async function () {
      data = normalizedData.article[0];
      expected = expected[0];
      await test('article');
    });

    it('Collection', async function () {
      data = normalizedData.article;
      await test('article');
    });

    it('Collection - Depth(0)', async function () {
      data = deepClone(normalizedData.article);
      expected = normalizedData.article;
      await test('article', 0);
    });

    it('Collection - Depth(1)', async function () {
      data = deepClone(normalizedData.article);
      expected.forEach(article => {
        article.author = deepClone(article.author);
        article.author.role = article.author.role.id;
        if (article.comments) {
          article.comments = article.comments.map(comment => {
            comment = deepClone(comment);
            comment.author = comment.author.userName;
            return comment;
          });
        }
      });
      await test('article', 1);
    });

    it('Collection - Depth({author: 0})', async function () {
      data = deepClone(normalizedData.article);
      expected.forEach(article => {
        article.author = deepClone(article.author);
        article.author.role = article.author.role.id;
        if (article.comments) {
          article.comments = article.comments.map(c => c.id);
        }
      });

      await test('article', { author: 1 });
    });

    it('Collection - Depth({author: null})', async function () {
      data = deepClone(normalizedData.article);
      expected.forEach(article => {
        article.author = deepClone(article.author);
        if (article.comments) {
          article.comments = article.comments.map(comment => comment.id);
        }
      });

      await test('article', { author: null }); // endless deserialization for `author`, exclude comments
      await test('article', { author: { role: 0 } });
      await test('article', { author: { role: 1 } });
    });

    it('Collection - Depth({author: 1, comments: 0})', async function () {
      data = deepClone(normalizedData.article);
      expected.forEach(article => {
        article.author = deepClone(article.author);
        if (article.comments) {
          article.comments = article.comments.map(comment => {
            comment = deepClone(comment);
            comment.author = comment.author.userName;
            return comment;
          });
        }
      });

      // endless deserialization for `author`, comments without deserialized props
      await test('article', { author: null, comments: 0 });
    });

    it('Collection - Depth({author: 1, comments: 1})', async function () {
      data = deepClone(normalizedData.article);
      expected.forEach(article => {
        article.author = deepClone(article.author);
        if (article.comments) {
          article.comments = article.comments.map(comment => {
            comment = deepClone(comment);
            comment.author = comment.author.userName;
            return comment;
          });
        }
      });

      // deserialize `author`, comments with author but no role
      await test('article', { author: null, comments: 1 });
      await test('article', { author: 1, comments: 1 });
      await test('article', { author: 1, comments: { author: 0 } });
    });

    it('Collection - Depth({author: 1, comments: 1})', async function () {
      data = deepClone(normalizedData.article);

      // deserialize everything
      await test('article', { author: null, comments: null });
      await test('article', { author: 1, comments: 2 });
    });

    it('Reverse references', async function () {
      normalizedData = deepClone(Blog.DATA_NORMALIZED_RR);
      denormalizer = new DenormalizerBuilder()
        .schemaConfig(schemaConfig)
        .normalizedData(normalizedData)
        .reverseRefsDeleted(true)
        .build();
      data = normalizedData.article;
      await test('article');
    });

    describe('Invalid data', function () {

      it('Expected array', async function () {
        data = deepClone(normalizedData.article[0]);
        data.comments = data.comments[0];
        expected = expected[0];
        await expect(denormalizer.apply('article', data))
          .rejects.toEqual(new Error('"article.comments" is expected to be an array but got object.'));
      });

      it('Expected object', async function () {
        data = deepClone(normalizedData.article[0]);
        data.author = [data.author];
        expected = expected[0];
        await expect(denormalizer.apply('article', data))
          .rejects.toEqual(new Error('"article.author" is expected to be an object but got array.'));
      });
    });
  });
});
