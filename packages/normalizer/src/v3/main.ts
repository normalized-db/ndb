import { denormalizerFactory } from './denormalizer';
import { normalizer } from './normalizer';
import type { AbstractSchemaStructure, SchemaConfig, SchemaStructure } from './normalizer-config-types';
import type { DenormalizerFactoryOptions, NormalizedDb, NormalizeOptions } from './normalizer-types';
import { buildSchema } from './schema';
import { buildState } from './state';

export function normalizedDb<DataTypes extends SchemaStructure, AbstractDataTypes extends AbstractSchemaStructure = {}>(
  config: SchemaConfig<DataTypes, AbstractDataTypes>,
  globalOptions: {
    normalize?: NormalizeOptions<DataTypes>,
    denormalize?: DenormalizerFactoryOptions<DataTypes, any, any>,
  } = {},
): NormalizedDb<DataTypes> {
  const schema = buildSchema(config);
  const state = buildState(schema);

  return {
    schema,
    state,
    normalize: normalizer(schema, globalOptions.normalize),
    denormalizer: denormalizerFactory(schema, globalOptions.denormalize),
  };
}
