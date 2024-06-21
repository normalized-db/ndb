import { DataStore, IdbContextBuilder } from '@normalized-db/data-store';
import { DenormalizerBuilder, NormalizerBuilder, Schema } from '@normalized-db/normalizer';

export const schema = new Schema({
  _defaults: {
    key: 'id',
    autoKey: false,
    logging: {
      mode: 'simple',
    },
  },
  _createdBy: {
    targets: {
      createdBy: 'user',
    },
  },
  user: {
    key: 'userName',
  },
  blogPost: {
    parent: '_createdBy',
    targets: {
      comments: {
        type: 'comment',
        cascadeRemoval: true,
        isArray: true,
      },
    },
  },
  comment: '_createdBy',
});

export type StoreTypes = 'user' | 'blogPost' | 'comment';

export function createDataStore() {
  const normalizerBuilder = new NormalizerBuilder()
    .schema(schema)
    .reverseReferences(true)
    .uniqueKeyCallback(() => Date.now().toString(36) + Math.random().toString(36).substring(2, 5));

  const denormalizerBuilder = new DenormalizerBuilder().schema(schema);

  const context = new IdbContextBuilder<StoreTypes>()
    .dbName('ndb-demo')
    .dbVersion(1)
    .schema(schema)
    .normalizerBuilder(normalizerBuilder)
    .denormalizerBuilder(denormalizerBuilder)
    .enableLogging(true)
    .build();

  return new DataStore(context);
}
