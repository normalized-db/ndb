import { IStoreLogConfig } from './store-log-config-interface';
import { IStoreTargetConfig } from './store-target-config-interface';

export interface IStoreConfig {
  parent?: string;
  key?: string;
  autoKey?: boolean;
  targets?: IStoreTargetConfig;
  logging?: IStoreLogConfig;
}
