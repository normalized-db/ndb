import { ISchemaConfig } from '../model/schema-config-interface';
import { Schema } from '../schema';
import { StoreBuilder } from './store-builder';

export class SchemaBuilder {

  private readonly defaultStore = new StoreBuilder();
  private readonly schema: { [type: string]: StoreBuilder } = { [Schema.TYPE_DEFAULTS]: this.defaultStore };

  public get getDefaultStore(): StoreBuilder {
    return this.defaultStore;
  }

  public setDefaultKey(key: string): SchemaBuilder {
    this.defaultStore.setKey(key);
    return this;
  }

  public setDefaultAutoKey(autoKey: boolean): SchemaBuilder {
    this.defaultStore.setAutoKey(autoKey);
    return this;
  }

  public setDefaultTarget(field: string, type: string, cascadeRemoval: boolean = false): SchemaBuilder {
    this.defaultStore.setTarget(field, type, cascadeRemoval);
    return this;
  }

  public setDefaultArrayTarget(field: string, type: string, cascadeRemoval: boolean = false): SchemaBuilder {
    this.defaultStore.setArrayTarget(field, type, cascadeRemoval);
    return this;
  }

  public hasStore(type: string): boolean {
    return type in this.schema;
  }

  public getStore(type: string): StoreBuilder {
    if (this.hasStore(type)) {
      return this.schema[type];
    } else {
      throw new Error('No prefix \'' + type + '\' is defined');
    }
  }

  public setStore(type: string, parent: string = null): StoreBuilder {
    const storeBuilder = new StoreBuilder(parent);
    this.schema[type] = storeBuilder;

    return storeBuilder;
  }

  public setAbstractStore(type: string, parent: string = null): StoreBuilder {
    return this.setStore('_' + type, parent);
  }

  public getAbstractStore(type: string): StoreBuilder {
    return this.getStore('_' + type);
  }

  public removeStore(type: string): SchemaBuilder {
    if (this.hasStore(type)) {
      delete this.schema[type];
    }

    return this;
  }

  public get build(): ISchemaConfig {
    return Object.keys(this.schema)
      .filter(type => this.schema[type] instanceof StoreBuilder)
      .reduce((result, type) => {
        result[type] = this.schema[type].build;
        return result;
      }, {});
  }
}
