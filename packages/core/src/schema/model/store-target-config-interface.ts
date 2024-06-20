import { IStoreTargetItem } from './store-target-item-interface';

export interface IStoreTargetConfig {
  [key: string]: string | IStoreTargetItem;
}
