import type { ISchemaExpanded } from '../../../src/core';

export const SCHEMA_EXPANDED: ISchemaExpanded = {
  role: {
    key: 'id',
    autoKey: true,
    targets: {},
    logging: { mode: 'disabled' },
    type: 'role',
  },
  user: {
    type: 'user',
    key: 'userName',
    autoKey: true,
    targets: {
      role: { type: 'role' },
    },
    logging: {
      mode: 'disabled',
      eventSelection: 'created',
      keys: [1, 2],
    },
  },
  article: {
    type: 'article',
    key: 'id',
    autoKey: true,
    targets: {
      author: { type: 'user' },
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
    type: 'comment',
    key: 'id',
    autoKey: true,
    targets: {
      author: { type: 'user' },
    },
    logging: {
      mode: 'simple',
    },
  },
};
