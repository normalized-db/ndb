import type { AbstractSchemaStructure, PropertiesConfig, SchemaConfig, SchemaStructure } from './normalizer-config-types';
import type { Entity, Schema } from './normalizer-types';

const defaultsKey: keyof SchemaConfig<unknown, unknown> = '@defaults';

export function buildSchema<DataTypes extends SchemaStructure, AbstractDataTypes extends AbstractSchemaStructure = {}>(
  config: SchemaConfig<DataTypes, AbstractDataTypes>,
): Schema<DataTypes> {
  const schema = {};
  for (const key of Object.keys(config)) {
    if (key.charAt(0) !== '@') {
      schema[key] = buildType(config, key);
    }
  }

  return schema as Schema<DataTypes>;
}

function buildType<
  DataTypes extends SchemaStructure,
  EntityKey extends keyof DataTypes,
  AbstractDataTypes extends AbstractSchemaStructure
>(
  schemaConfig: SchemaConfig<DataTypes, AbstractDataTypes>,
  entityKey: EntityKey,
): Entity<DataTypes, EntityKey> {
  const entity = schemaConfig[entityKey];
  if (!entity) {
    throw new Error(`Schema config expected to have '${String(entityKey)}' but had [${Object.keys(schemaConfig).sort()}]`);
  }

  const parentEntityKey = typeof entity === 'string' ? entity : entity.parent;
  const parent = entityKey === defaultsKey
    ? undefined
    : parentEntityKey
      ? buildType(schemaConfig, parentEntityKey)
      : defaultsKey in schemaConfig
        ? buildType(schemaConfig, defaultsKey)
        : undefined;

  let keyPath = parent?.key;
  let targets = parent?.targets ?? {};
  let autoKey = parent?.autoKey ?? false;
  let logging = parent?.logging ?? { mode: 'disabled' };
  if (typeof entity === 'object') {
    if (entity.key) {
      keyPath = entity.key;
    }

    if (entity.targets) {
      const entityTargets = buildTargets(entity.targets);
      targets = { ...targets, ...entityTargets };
    }

    if (entity.dataStore) {
      if (entity.dataStore.autoKey !== undefined) {
        autoKey = entity.dataStore.autoKey;
      }

      if (entity.dataStore.logging !== undefined) {
        logging = entity.dataStore.logging;
      }
    }
  }

  if (keyPath === undefined) {
    throw new Error(`Entity '${String(entityKey)}' is missing a key path`);
  }

  return {
    key: keyPath,
    targets,
    autoKey,
    logging,
  };
}

function buildTargets<
  DataTypes extends SchemaStructure,
  EntityKey extends keyof DataTypes
>(targets: PropertiesConfig<DataTypes, EntityKey>) {
  const entityTargets = {};
  for (const [propKey, propConfig] of Object.entries(targets)) {
    entityTargets[propKey] = typeof propConfig === 'object'
      ? {
        type: propConfig.type,
        isArray: propConfig.isArray ?? false,
        cascadeRemoval: propConfig.dataStore?.cascadeRemoval ?? false,
      }
      : {
        type: propConfig,
        isArray: false,
        cascadeRemoval: false,
      };
  }

  return entityTargets;
}

