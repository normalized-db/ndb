export type NormalizableObject = InstanceType<any>;
export type SchemaStructure = Record<string, NormalizableObject>;
export type AbstractSchemaStructure = Record<string, NormalizableObject>;

export type KeyTypes = string | number;

export type ObjectKey<T, WhereExtends = any> = {
  [K in keyof T]: T[K] extends WhereExtends ? K : never;
}[keyof T];

export type SchemaConfig<
  DataTypes extends SchemaStructure,
  AbstractDataTypes extends AbstractSchemaStructure = Record<string, never>
> = {
  [EntityKey in keyof DataTypes]: EntityConfig<DataTypes, EntityKey, AbstractDataTypes>
} & {
  [EntityKey in keyof AbstractDataTypes as `@${EntityKey & string}`]: EntityConfig<DataTypes, keyof DataTypes, AbstractDataTypes>
} & {
  '@defaults'?: {
    key?: {
      [EntityKey in keyof DataTypes]: ObjectKey<DataTypes[EntityKey], KeyTypes>;
    }[keyof DataTypes],
    targets?: PropertiesConfig<DataTypes, any>;
    dataStore?: DataStoreConfig;
  },
};

export type EntityTypeReference<DataTypes extends SchemaStructure> = keyof DataTypes & string;

type AbstractEntityKey<AbstractDataTypes extends AbstractSchemaStructure> = {
  [EntityKey in keyof AbstractDataTypes as `@${EntityKey & string}`]: AbstractDataTypes[EntityKey]
};

export type ParentConfigReference<DataTypes extends SchemaStructure, AbstractDataTypes extends AbstractSchemaStructure> =
  '@defaults'
  | (keyof AbstractEntityKey<AbstractDataTypes> & string)
  | (keyof DataTypes & string);

export type DataStoreConfig = {
  autoKey?: boolean;
  logging?: StoreLogConfig;
};

export type EntityConfig<
  DataTypes extends SchemaStructure,
  EntityKey extends keyof DataTypes,
  AbstractDataTypes extends AbstractSchemaStructure,
> = ParentConfigReference<DataTypes, AbstractDataTypes> | {
  key?: ObjectKey<DataTypes[EntityKey], KeyTypes>;
  parent?: ParentConfigReference<DataTypes, AbstractDataTypes>;
  targets?: PropertiesConfig<DataTypes, EntityKey>;
  dataStore?: DataStoreConfig;
};

export type PropertiesConfig<
  DataTypes extends SchemaStructure,
  EntityKey extends keyof DataTypes
> = {
  [Property in keyof DataTypes[EntityKey]]?: EntityTypeReference<DataTypes> | PropertyConfig<DataTypes>
};

export type PropertyConfig<DataTypes extends SchemaStructure> = {
  type: EntityTypeReference<DataTypes>,
  isArray?: boolean;
  dataStore?: {
    cascadeRemoval?: boolean;
  }
};

export type StoreLogConfig = {
  mode: LogMode;
  eventSelection?: EventSelection;
};

export type EventType = 'created' | 'updated' | 'removed' | 'cleared';
export type EventSelection = EventType | EventType[];

export const enum LogMode {
  Disabled = 'Disabled', // no logging
  Simple = 'simple', // `LogEntry<?>` except `item`-field
  Full = 'full', // include `item`-field
}
