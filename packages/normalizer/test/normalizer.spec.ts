import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { deepClone, ISchemaConfig, ValidKey } from '../src/core';
import { INormalizer, NormalizerBuilder } from '../src/normalizer';
import * as Blog from './data/blog-post';
import * as User from './data/user';

describe('Normalizer', function () {

  let schemaConfig: ISchemaConfig;
  let normalizer: INormalizer;
  let data;
  let normalizedData;

  async function test(rootEntity: string) {
    const result = await normalizer.apply(rootEntity, data);
    expect(result).toEqual(normalizedData);
  }

  afterEach(function () {
    schemaConfig = null;
    normalizer = null;
    data = null;
    normalizedData = null;
  });

  const nextKey = () => {
    // https://stackoverflow.com/a/2117523/3863059
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;
  const uniqueKeyCallback = () => new Promise<ValidKey>((
      resolve => setTimeout(() => resolve(nextKey()), random(10, 500))));

  describe('Invalid types', function () {

    beforeEach(function () {
      schemaConfig = User.SCHEMA;
      normalizer = new NormalizerBuilder()
          .schemaConfig(schemaConfig)
          .uniqueKeyCallback(uniqueKeyCallback)
          .build();
    });

    it('Apply', async function () {
      await expect(normalizer.apply('user', {})).resolves.not.toBeNull();
      await expect(normalizer.apply('invalid', {})).rejects.toEqual(new Error('Type "invalid" is not configured'));
    });

  });

  describe('Users', function () {

    beforeEach(function () {
      schemaConfig = User.SCHEMA;
      normalizer = new NormalizerBuilder()
          .schemaConfig(schemaConfig)
          .uniqueKeyCallback(uniqueKeyCallback)
          .build();
      data = deepClone(User.DATA);
      normalizedData = deepClone(User.DATA_NORMALIZED);
    });

    it('Single Item', async function () {
      data = deepClone(User.USER1);
      normalizedData.role = [User.USER1.role];
      normalizedData.user = [User.normalize(User.USER1)];
      await test('user');
    });

    it('Collection', async function () {
      await test('user');
    });

    it('Reverse references', async function () {
      normalizer = new NormalizerBuilder()
          .schemaConfig(schemaConfig)
          .uniqueKeyCallback(uniqueKeyCallback)
          .reverseReferences(true)
          .build();
      normalizedData = deepClone(User.DATA_NORMALIZED_RR);
      await test('user');
    });

    describe('Normalized Data', function () {

      it('Single Item', async function () {
        data = normalizedData.user[0];
        normalizedData = { user: [normalizedData.user[0]] };
        await test('user');
      });

      it('Collection', async function () {
        data = normalizedData.user;
        normalizedData = { user: normalizedData.user };
        await test('user');
      });

      it('Partly normalized', async function () {
        data = [
          data[0],
          normalizedData.user[1],
          data[2],
        ];
        await test('user');
      });

    });
  });

  describe('Blog Posts', function () {

    beforeEach(function () {
      schemaConfig = Blog.SCHEMA;
      normalizer = new NormalizerBuilder()
          .schemaConfig(schemaConfig)
          .uniqueKeyCallback(uniqueKeyCallback)
          .build();
    });

    it('Single item', async function () {
      data = Blog.POST1;
      normalizedData = {
        article: [Blog.normalizePost(Blog.POST1)],
        comment: Blog.normalizeAllComments(Blog.POST1.comments),
        user: Blog.normalizeAllUsers([Blog.USER_MMUSTER, Blog.USER_TIMLER42, Blog.USER_ALEXK]),
        role: [Blog.ROLE2, Blog.ROLE1],
      };

      await test('article');
    });

    it('Collection', async function () {
      data = Blog.DATA;
      normalizedData = Blog.DATA_NORMALIZED;
      await test('article');
    });

    it('Reverse references', async function () {
      normalizer = new NormalizerBuilder()
          .schemaConfig(schemaConfig)
          .uniqueKeyCallback(uniqueKeyCallback)
          .reverseReferences(true)
          .build();
      data = Blog.DATA;
      normalizedData = deepClone(Blog.DATA_NORMALIZED_RR);
      await test('article');
    });

    describe('Invalid data', function () {

      async function testError(error: string) {
        // assert.throws(() => normalizer.apply('article', data), error);
        // expect(normalizer.apply('article', data)).to.be.throws(error);
        await expect(normalizer.apply('article', data)).rejects.toEqual(new Error(error));
      }

      it('Expected array', async function () {
        data = deepClone(Blog.POST1);
        data.comments = data.comments[0];
        await testError('"article.comments" is expected to be an array but got object.');
      });

      it('Expected object', async function () {
        data = deepClone(Blog.POST1);
        data.author = [data.author];
        await testError('"article.author" is expected to be an object but got array.');
      });
    });
  });
});
