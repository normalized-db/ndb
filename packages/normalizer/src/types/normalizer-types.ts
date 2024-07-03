import type { KeyTypes, ObjectKey, SchemaStructure, StoreLogConfig } from './normalizer-config-types';
import type { FlattenArray } from './utils-types';

export type NormalizedDb<DataTypes extends SchemaStructure> = {
  schema: Schema<DataTypes>;
  state: StateFunction<DataTypes>;
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

export type StateFunction<DataTypes extends SchemaStructure> = {
  mergeTrees: (tree1: NormalizedDataTree<DataTypes>, tree2: NormalizedDataTree<DataTypes>) => NormalizedDataTree<DataTypes>,
  findEntityKeys: <
    EntityType extends keyof DataTypes,
    KeyPath extends ObjectKey<DataTypes[EntityType], KeyTypes>,
    Key extends DataTypes[EntityType][KeyPath],
  >(
    tree: NormalizedDataTree<DataTypes>,
    rootType: EntityType,
    rootKeys?: Key | Key[],
  ) => PreloadEntities<DataTypes>,
};

export type NormalizedData<DataTypes extends SchemaStructure> = {
  tree: NormalizedDataTree<DataTypes>,
  keyMap: KeyMap<DataTypes>,
  entities: NormalizedEntities<DataTypes>,
};

export type NormalizedDataTree<DataTypes extends SchemaStructure> = {
  [EntityKey in keyof DataTypes]?: EntityTree<DataTypes, EntityKey>
};

export type EntityTree<DataTypes extends SchemaStructure, EntityType extends keyof DataTypes> = {
  [Key in KeyTypes]: {
    props?: { [Property in ObjectKey<DataTypes[EntityType], object | object[]>]?: KeyTypes | KeyTypes[] },
    refs?: { [ParentType in keyof DataTypes]?: KeyTypes[] },
  }
};

export type KeyMap<DataTypes extends SchemaStructure> = {
  [EntityKey in keyof DataTypes]?: {
    [Key in KeyTypes]: number
  };
};

export type NormalizedEntities<DataTypes extends SchemaStructure> = {
  [EntityType in keyof DataTypes]?: NormalizedItem<DataTypes, EntityType>[]
};

export type NormalizedItem<DataTypes extends SchemaStructure, EntityKey extends keyof DataTypes> = Partial<DataTypes[EntityKey]>;

export type ReverseReferences<DataTypes extends SchemaStructure> = {
  [type in keyof DataTypes]?: Set<KeyTypes>;
};

export type UniqueKeyCallback<DataTypes extends SchemaStructure> = <
  EntityKey extends keyof DataTypes,
  T extends DataTypes[EntityKey]
> (type: EntityKey) => T[EntityKey];

export type NormalizeOptions<DataTypes extends SchemaStructure> = {
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

export type DenormalizerFactoryOptions<
  DataTypes extends SchemaStructure,
  EntityKey extends keyof DataTypes,
  T extends DataTypes[EntityKey]
> = {
  depth?: Depth<T>,
};

export type DenormalizerFactory<
  DataTypes extends SchemaStructure
> = {
  preload: (
    tree: NormalizedDataTree<DataTypes>,
    entities: PreloadEntities<DataTypes>,
    load: <
      EntityKey extends keyof DataTypes,
      KeyPath extends ObjectKey<DataTypes[EntityKey], KeyTypes>,
    >(type: EntityKey, keys: DataTypes[EntityKey][KeyPath][]) => Promise<DataTypes[EntityKey][]>,
  ) => Promise<{ ofType: DenormalizeFunction<DataTypes> }>,
  fromData: (data: NormalizedData<DataTypes>) => { ofType: DenormalizeFunction<DataTypes> },
};

export type DenormalizeFunction<
  DataTypes extends SchemaStructure
> = <
  EntityKey extends keyof DataTypes,
  KeyPath extends ObjectKey<DataTypes[EntityKey], KeyTypes>,
  T extends DataTypes[EntityKey]
>(
  type: EntityKey,
  options?: DenormalizerFactoryOptions<DataTypes, EntityKey, T>,
) => {
  fromKey: (key: T[KeyPath]) => T,
  fromKeys: (keys: T[KeyPath][]) => T[],
  all: () => T[],
};

export type ParentRef<DataTypes extends SchemaStructure, EntityKey extends keyof DataTypes, Key extends KeyTypes> = {
  type: EntityKey,
  key: Key,
} | undefined;

export type PreloadEntities<DataTypes extends SchemaStructure> = Map<keyof DataTypes, Set<KeyTypes>>;
