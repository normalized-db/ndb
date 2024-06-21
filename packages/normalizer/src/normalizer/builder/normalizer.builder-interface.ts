import { ISchema, ISchemaConfig, UniqueKeyCallback } from '../../core';
import { INormalizer } from '../normalizer-interface';

export interface INormalizerBuilder {
  schema(schema: ISchema): INormalizerBuilder;

  schemaConfig(schemaConfig: ISchemaConfig): INormalizerBuilder;

  reverseReferences(useReverseReferences: boolean): INormalizerBuilder;

  uniqueKeyCallback(uniqueKeyCallback: UniqueKeyCallback): INormalizerBuilder;

  build(): INormalizer;
}
