import { denormalizerFactory } from './impl/denormalizer';
import { normalizer } from './impl/normalizer';
import { buildSchema } from './impl/schema';
import { buildState } from './impl/state';
import type { AbstractSchemaStructure, SchemaConfig, SchemaStructure } from './types/normalizer-config-types';
import type { DenormalizerFactoryOptions, NormalizedDb, NormalizeOptions } from './types/normalizer-types';

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
