import { describe, expect, it } from '@jest/globals';
import { Schema } from '../../src';
import * as Blog from '../data/blog-post';
import * as User from '../data/user';

describe('Schema', function () {

  describe('Expansion', function () {

    function test(schema: Schema, expectedResult) {
      const schemaJSON = schema.toString();
      const expectedJSON = JSON.stringify(expectedResult);
      expect(schemaJSON).toEqual(expectedJSON);
    }

    it('User', function () {
      test(new Schema(User.SCHEMA), User.SCHEMA_EXPANDED);
    });

    it('Blog Posts', function () {
      test(new Schema(Blog.SCHEMA), Blog.SCHEMA_EXPANDED);
    });
  });
});
