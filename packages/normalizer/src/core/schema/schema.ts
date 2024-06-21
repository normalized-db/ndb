import { deepClone, isNull } from '../utility';
import { StoreLogBuilder } from './builder/store-log-builder';
import { ISchemaConfig, ISchemaExpanded, IStore, IStoreConfig, IStoreTarget, IStoreTargetConfig, IStoreTargetItem } from './model';
import { ISchema } from './schema-interface';
import { SchemaLogConfig } from './schema-log-config';

export class Schema implements ISchema {

  public static readonly TYPE_DEFAULTS = '_defaults';

  private readonly config: ISchemaExpanded;
  private readonly userConfig: ISchemaConfig;

  private readonly logConfig: SchemaLogConfig;

  constructor(userConfig: ISchemaConfig) {
    this.config = {};
    this.userConfig = deepClone(userConfig);

    this.initDefaults();
    const keys = Object.keys(this.userConfig);

    keys.filter(type => !type.startsWith('_'))
        .forEach(type => this.config[type] = this.expandSchemaForType(type));

    this.logConfig = new SchemaLogConfig(this);
  }

  public getLogConfig(): SchemaLogConfig {
    return this.logConfig;
  }

  public hasType(type: string): boolean {
    return type in this.config;
  }

  public getTypes(): string[] {
    return Object.keys(this.config);
  }

  public getConfig(type: string): IStore {
    if (this.hasType(type)) {
      return this.config[type];
    } else {
      this.onNoSchemaFound(type);
    }
  }

  public getTargetItem(type: string, field): IStoreTargetItem {
    const config = this.getConfig(type);
    if (field in config.targets) {
      return config.targets[field];
    } else {
      return null;
    }
  }

  public getTargetConfig(type: string, field: string): IStore {
    const config = this.getConfig(type);
    if (field in config.targets) {
      return this.getConfig(config.targets[field].type);
    } else {
      this.onNoSchemaFound(type + '.' + field);
    }
  }

  public toString(): string {
    return JSON.stringify(this.config);
  }

  private initDefaults() {
    if (Schema.TYPE_DEFAULTS in this.userConfig) {
      if (typeof this.userConfig._defaults !== 'object') {
        throw new Error('Defaults must be an instance of `IStoreConfig`');
      }

      this.userConfig._defaults.autoKey = this.userConfig._defaults.autoKey === true;

      if (!('targets' in this.userConfig._defaults)) {
        this.userConfig._defaults.targets = {};
      }

    } else {
      this.userConfig._defaults = {
        autoKey: false,
        targets: {}
      };
    }
  }

  private expandSchemaForType(type: string): IStore {
    if (type in this.userConfig && this.userConfig[type]) {
      const typeSchema = this.userConfig[type];

      if (type === Schema.TYPE_DEFAULTS) {
        const defaults: IStoreConfig = this.userConfig[Schema.TYPE_DEFAULTS] || {};
        if (defaults.targets) {
          defaults.targets = this.expandTargets(defaults.targets);
        }
        if (!defaults.logging) {
          defaults.logging = new StoreLogBuilder().build();
        }

        return deepClone(defaults);

      } else if (typeSchema === true) {
        return Object.assign(this.expandSchemaForType(Schema.TYPE_DEFAULTS), { type: type }); // use defaults

      } else if (typeof typeSchema === 'string') {
        return Object.assign(deepClone(this.expandSchemaForType(typeSchema)), { type: type }); // get "parent" config

      } else if (typeof typeSchema === 'object') {
        // merge config with parent (or defaults if no parent specified)
        const parentSchema = this.expandSchemaForType(typeSchema.parent || Schema.TYPE_DEFAULTS);
        return this.mergeConfigs(type, typeSchema, parentSchema);

      } else {
        throw new Error('Schema for type \'' + type + '\' is invalid');
      }

    } else {
      this.onNoSchemaFound(type);
    }
  }

  private mergeConfigs(type: string, typeConfig: IStoreConfig, parent: IStore): IStore {
    const autoKey = isNull(typeConfig.autoKey || null) ? parent.autoKey : typeConfig.autoKey;
    const targets = Object.assign(parent.targets, typeConfig.targets);
    const logging = Object.assign(parent.logging, typeConfig.logging);

    return {
      type: type,
      key: typeConfig.key || parent.key,
      autoKey: autoKey || false,
      targets: this.expandTargets(targets),
      logging: logging
    };
  }

  private expandTargets(targetConfig: IStoreTargetConfig): IStoreTarget {
    const result: IStoreTarget = {};
    Object.keys(targetConfig).forEach(field => {
      const item = targetConfig[field];
      result[field] = typeof item === 'string'
          ? { type: item }
          : item;
    });

    return result;
  }

  private onNoSchemaFound(type: string) {
    throw new Error('No config found for type \'' + type + '\'');
  }
}
