import { Schema, type ISchemaConfig } from '../core';
import { buildDenormalizer } from './denormalizer';
import { buildNormalizer } from './normalizer';
import type { AbstractSchemaStructure, SchemaConfig, SchemaStructure } from './normalizer-config-types';
import type { DenormalizerFactoryOptions, NormalizedDb, NormalizeOptions } from './normalizer-types';
import { buildSchema } from './schema';

export function configure<DataTypes extends SchemaStructure, AbstractDataTypes extends AbstractSchemaStructure = {}>(
  config: SchemaConfig<DataTypes, AbstractDataTypes>,
  globalOptions: {
    normalize?: NormalizeOptions,
    denormalize?: DenormalizerFactoryOptions,
  } = {},
): NormalizedDb<DataTypes> {
  const schema = buildSchema(config);
  const legacySchema = new Schema(schema as ISchemaConfig);

  return {
    schema,
    normalize: buildNormalizer(legacySchema, globalOptions.normalize),
    denormalizer: buildDenormalizer(legacySchema, globalOptions.denormalize),
  };
}
