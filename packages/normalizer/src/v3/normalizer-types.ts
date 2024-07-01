import type { KeyTypes, ObjectKey, SchemaStructure, StoreLogConfig } from './normalizer-config-types';
import type { FlattenArray } from './utils-types';

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
  logging: StoreLogConfig;
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

export type NormalizedData<DataTypes extends SchemaStructure> = {
  keyMap: KeyMap<DataTypes>,
  tree: NormalizedDataTree<DataTypes>,
  entities: NormalizedEntities<DataTypes>,
};

export type KeyMap<DataTypes extends SchemaStructure> = {
  [EntityKey in keyof DataTypes]?: Map<KeyTypes, number>;
};

export type NormalizedDataTree<DataTypes extends SchemaStructure> = {
  [EntityKey in keyof DataTypes]?: EntityTree<DataTypes, EntityKey>
};

export type EntityTree<DataTypes extends SchemaStructure, EntityKey extends keyof DataTypes> =
  Map<KeyTypes, Map<keyof DataTypes[EntityKey], KeyTypes | KeyTypes[]>>;

export type NormalizedEntities<DataTypes extends SchemaStructure> = {
  [EntityKey in keyof DataTypes]?: NormalizedItem<DataTypes, EntityKey>[]
};

export type NormalizedItem<DataTypes extends SchemaStructure, EntityKey extends keyof DataTypes> =
  DataTypes[EntityKey] & { _refs?: ReverseReferences<DataTypes> };

export type ReverseReferences<DataTypes extends SchemaStructure> = {
  [type in keyof DataTypes]?: Set<KeyTypes>;
};

export type UniqueKeyCallback<DataTypes extends SchemaStructure> = <
  EntityKey extends keyof DataTypes,
  T extends DataTypes[EntityKey]
> (type: EntityKey) => T[EntityKey];

export type NormalizeOptions<DataTypes extends SchemaStructure> = {
  reverseRefs?: boolean,
  uniqueKeyCallback?: UniqueKeyCallback<DataTypes>,
};

export type NormalizeFunction<DataTypes extends SchemaStructure> = <
  EntityKey extends keyof DataTypes,
  T extends DataTypes[EntityKey]
>(
  type: EntityKey,
  data: T | T[],
  options?: NormalizeOptions<DataTypes>,
) => NormalizedData<DataTypes>;

export type Depth<EntityType = any> = number | {
  [Target in keyof EntityType]?: FlattenArray<Depth<EntityType[Target]>>;
};

export type FetchCallback<
  DataTypes extends SchemaStructure,
  EntityKey extends keyof DataTypes,
  T extends DataTypes[EntityKey],
> = (type: EntityKey, key: KeyTypes) => T | Promise<T>;

export type DenormalizerFactoryOptions<
  DataTypes extends SchemaStructure,
  EntityKey extends keyof DataTypes,
  T extends DataTypes[EntityKey]
> = {
  fetchCallback?: FetchCallback<DataTypes, EntityKey, T>,
  depth?: Depth<T>,
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
  options?: DenormalizerFactoryOptions<DataTypes, EntityKey, T>,
) => {
  fromKey: (key: T[KeyPath]) => T,
  fromKeys: (keys: T[KeyPath][]) => T[],
  fromData: (data: T) => T,
  fromArray: (data: T[]) => T[],
};

export type ParentRef<DataTypes extends SchemaStructure, EntityKey extends keyof DataTypes, Key extends KeyTypes> = {
  type: EntityKey,
  key: Key,
} | undefined;
