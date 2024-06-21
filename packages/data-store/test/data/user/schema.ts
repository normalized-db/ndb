import { ISchemaConfig } from '@normalized-db/normalizer';

export const SCHEMA: ISchemaConfig = {
  _defaults: {
    key: 'id',
    autoKey: true
  },
  user: {
    targets: {
      role: 'role'
    }
  },
  role: true
};
