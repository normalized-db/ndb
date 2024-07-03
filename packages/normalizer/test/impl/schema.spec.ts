import { describe, expect, it } from '@jest/globals';
import { normalizedDb } from '../../src/main';
import { LogMode } from '../../src/types/normalizer-config-types';
import type { Schema } from '../../src/types/normalizer-types';
import { type AbstractDemoSchema, type DemoStructure, schemaConfig } from '../mock-data';

describe('v3/Schema', function () {

  it('Build schema', function () {
    const { schema } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
    expect(schema).toEqual({
      role: {
        key: 'id',
        targets: {},
        autoKey: false,
        logging: { mode: LogMode.Simple },
      },
      user: {
        key: 'userName',
        targets: {
          role: { type: 'role', isArray: false, cascadeRemoval: false },
        },
        autoKey: false,
        logging: {
          mode: LogMode.Full,
          eventSelection: ['created', 'removed'],
        },
      },
      blogPost: {
        key: 'id',
        targets: {
          author: { type: 'user', isArray: false, cascadeRemoval: false },
          comments: { type: 'comment', isArray: true, cascadeRemoval: true },
        },
        autoKey: false,
        logging: { mode: LogMode.Simple },
      },
      comment: {
        key: 'id',
        targets: {
          author: { type: 'user', isArray: false, cascadeRemoval: false },
        },
        autoKey: false,
        logging: { mode: LogMode.Simple },
      },
    } satisfies Schema<DemoStructure>);
  });

});
