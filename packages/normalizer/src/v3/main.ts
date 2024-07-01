import { denormalizer } from './denormalizer';
import { normalizer } from './normalizer';
import type { AbstractSchemaStructure, SchemaConfig, SchemaStructure } from './normalizer-config-types';
import type { DenormalizerFactoryOptions, NormalizedDb, NormalizeOptions } from './normalizer-types';
import { buildSchema } from './schema';

export function normalizedDb<DataTypes extends SchemaStructure, AbstractDataTypes extends AbstractSchemaStructure = {}>(
  config: SchemaConfig<DataTypes, AbstractDataTypes>,
  globalOptions: {
    normalize?: NormalizeOptions<DataTypes>,
    denormalize?: DenormalizerFactoryOptions<DataTypes, any, any>,
  } = {},
): NormalizedDb<DataTypes> {
  const schema = buildSchema(config);

  return {
    schema,
    normalize: normalizer(schema, globalOptions.normalize),
    denormalizer: denormalizer(schema, globalOptions.denormalize),
  };
}
