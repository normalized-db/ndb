import { IStoreLogConfig } from '../schema/model/store-log-config-interface';
import { EventType } from './event-type';
import { LogMode } from './log-mode-type';
import { ValidKey } from './valid-key';

export interface ILogConfig {

  getConfig(type: string, orDefault?: IStoreLogConfig): IStoreLogConfig;

  getLogMode(type: string, orDefault?: LogMode): LogMode;

  getEventTypes(type: string, orDefault?: EventType[]): EventType[];

  getKeys(type: string, orDefault?: ValidKey[]): ValidKey[];

  isLoggingEnabled(type: string, eventType?: EventType, key?: ValidKey): boolean;

}
