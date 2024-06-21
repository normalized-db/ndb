import { ISchemaConfig } from '../../../src/core';

export const SCHEMA: ISchemaConfig = {
  _defaults: {
    key: 'id',
    autoKey: true,
  },
  _authored: {
    targets: {
      author: 'user',
    },
  },
  role: true,
  user: {
    key: 'userName',
    targets: {
      role: 'role',
    },
    logging: {
      mode: 'disabled',
      eventSelection: 'created',
      keys: [1, 2],
    },
  },
  article: {
    parent: '_authored',
    targets: {
      comments: {
        type: 'comment',
        cascadeRemoval: true,
        isArray: true,
      },
    },
    logging: {
      mode: 'full',
      eventSelection: ['created', 'updated', 'removed'],
    },
  },
  comment: {
    parent: '_authored',
    logging: {
      mode: 'simple',
    },
  },
};
