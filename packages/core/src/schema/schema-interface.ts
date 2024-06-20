import { IStore, IStoreTargetItem } from './model';
import { SchemaLogConfig } from './schema-log-config';

export interface ISchema {
  getLogConfig(): SchemaLogConfig;
  hasType(type: string): boolean;
  getTypes(): string[];
  getConfig(type: string): IStore;
  getTargetItem(type: string, field): IStoreTargetItem;
  getTargetConfig(type: string, field: string): IStore;
  toString(): string;
}
