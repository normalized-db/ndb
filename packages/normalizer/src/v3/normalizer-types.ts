import { Depth, FetchCallback, IStoreLogConfig, type ReverseReferences, type UniqueKeyCallback, ValidKey } from '../core';
import type { KeyTypes, ObjectKey, SchemaStructure } from './normalizer-config-types';

export type NormalizedDb<DataTypes extends SchemaStructure> = {
  schema: Schema<DataTypes>;
  normalize: NormalizeFunction<DataTypes>;
  denormalizer: DenormalizerFactory<DataTypes>;
};

export type Schema<DataTypes extends SchemaStructure> = {
  [EntityKey in keyof DataTypes]: Entity<DataTypes, EntityKey>
};

export type Entity<
  DataTypes extends SchemaStructure,
  EntityKey extends keyof DataTypes,
> = {
  key: ObjectKey<DataTypes[EntityKey], KeyTypes>;
  targets: EntityTargets<DataTypes, EntityKey>;
  autoKey: boolean;
  logging: IStoreLogConfig;
};

export type EntityTargets<
  DataTypes extends SchemaStructure,
  EntityKey extends keyof DataTypes
> = {
  [Property in keyof DataTypes[EntityKey]]?: EntityProperty<DataTypes>
};

export type EntityProperty<DataTypes extends SchemaStructure> = {
  type: keyof DataTypes,
  isArray: boolean;
  cascadeRemoval: boolean;
};

export type KeyMap<DataTypes extends SchemaStructure> = {
  [EntityKey in keyof DataTypes]?: Map<ValidKey, number>;
};

export type NormalizedData<DataTypes extends SchemaStructure> = {
  [EntityKey in keyof DataTypes]?: (DataTypes[EntityKey] & { _refs?: ReverseReferences })[]
} | {
  _keyMap: KeyMap<DataTypes>,
};

export type NormalizeOptions = {
  reverseRefs?: boolean,
  uniqueKeyCallback?: UniqueKeyCallback | undefined,
};

export type NormalizeFunction<DataTypes extends SchemaStructure> = <
  EntityKey extends keyof DataTypes,
  T extends DataTypes[EntityKey]
>(
  type: EntityKey,
  data: T | T[],
  options?: NormalizeOptions,
) => Promise<NormalizedData<DataTypes>>;

export type DenormalizerFactoryOptions = {
  fetchCallback?: FetchCallback,
    depth?: number | Depth,
    reverseRefsDeleted?: boolean,
};

export type DenormalizerFactory<
  DataTypes extends SchemaStructure
> = <
  EntityKey extends keyof DataTypes,
  KeyPath extends ObjectKey<DataTypes[EntityKey], KeyTypes>,
  T extends DataTypes[EntityKey]
>(
  normalizedData: NormalizedData<DataTypes>,
  type: EntityKey,
  options?: DenormalizerFactoryOptions,
) => {
  fromArray: (data: T[]) => Promise<T[]>,
  fromData: (data: T) => Promise<T>,
  fromKeys: (keys: T[KeyPath][]) => Promise<T[]>,
  fromKey: (key: T[KeyPath]) => Promise<T>,
};
