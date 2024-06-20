import { IStoreConfig } from './store-config-interface';

export interface ISchemaConfig {
  _defaults?: IStoreConfig;
  [key: string]: true | string | IStoreConfig;
}
