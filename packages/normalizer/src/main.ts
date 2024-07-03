import { denormalizerFactory } from './impl/denormalizer';
import { normalizer } from './impl/normalizer';
import { buildSchema } from './impl/schema';
import { buildTools } from './impl/tools';
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
  const tools = buildTools(schema);

  return {
    schema,
    tools,
    normalize: normalizer(schema, globalOptions.normalize),
    denormalizer: denormalizerFactory(schema, globalOptions.denormalize),
  };
}
