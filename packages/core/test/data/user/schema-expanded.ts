import { ISchemaExpanded } from '../../../src';

export const SCHEMA_EXPANDED: ISchemaExpanded = {
  user: {
    type: 'user',
    key: 'id',
    autoKey: true,
    targets: {
      role: { type: 'role' }
    },
    logging: { mode: 'disabled' }
  },
  role: {
    key: 'id',
    autoKey: true,
    targets: {},
    logging: { mode: 'disabled' },
    type: 'role'
  }
};
