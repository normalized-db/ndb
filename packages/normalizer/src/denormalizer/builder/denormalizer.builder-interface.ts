import { FetchCallback, ISchema, ISchemaConfig, KeyMap, NormalizedData } from '../../core';
import { IDenormalizer } from '../denormalizer-interface';

export interface IDenormalizerBuilder {

  schema(schema: ISchema): IDenormalizerBuilder;

  schemaConfig(schemaConfig: ISchemaConfig): IDenormalizerBuilder;

  normalizedData(data: NormalizedData): IDenormalizerBuilder;

  keys(keys: KeyMap): IDenormalizerBuilder;

  reverseRefsDeleted(deleteReverseRefs: boolean): IDenormalizerBuilder;

  fetchCallback(fetchCallback: FetchCallback): IDenormalizerBuilder;

  build(): IDenormalizer;
}
