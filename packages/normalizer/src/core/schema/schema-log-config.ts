import { EventType, ILogConfig, LogMode, ValidKey } from '../model';
import { isNull } from '../utility/object';
import { StoreLogBuilder } from './builder/store-log-builder';
import { IStoreLogConfig } from './model/store-log-config-interface';
import { ISchema } from './schema-interface';

export class SchemaLogConfig implements ILogConfig {

  public constructor(private readonly _schema: ISchema) {
  }

  public getConfig(type: string, orDefault?: IStoreLogConfig): IStoreLogConfig {
    let config = orDefault || new StoreLogBuilder().build();
    if (this._schema.hasType(type)) {
      config = Object.assign(config, this._schema.getConfig(type).logging);
    }
    return config;
  }

  public getLogMode(type: string, orDefault: LogMode = 'disabled'): LogMode {
    return this._schema.hasType(type)
        ? this._schema.getConfig(type).logging.mode
        : orDefault;
  }

  public getEventTypes(type: string, orDefault?: EventType[]): EventType[] {
    let types: EventType[];
    if (this._schema.hasType(type)) {
      const eventSelection = this._schema.getConfig(type).logging.eventSelection;
      types = Array.isArray(eventSelection) ? eventSelection : [eventSelection];
    }
    return types && types.length > 0 ? types : orDefault;
  }

  public getKeys(type: string, orDefault?: ValidKey[]): ValidKey[] {
    let keys: ValidKey[];
    if (this._schema.hasType(type)) {
      keys = this._schema.getConfig(type).logging.keys;
    }
    return keys && keys.length > 0 ? keys : orDefault;
  }

  public isLoggingEnabled(type: string, eventType?: EventType, key?: ValidKey): boolean {
    let isEnabled = this._schema.hasType(type);
    if (isEnabled) {
      const logConfig = this._schema.getConfig(type).logging;
      isEnabled = logConfig.mode !== 'disabled';

      if (isEnabled && eventType && logConfig.eventSelection) {
        isEnabled = Array.isArray(logConfig.eventSelection)
            ? logConfig.eventSelection.length === 0 || logConfig.eventSelection.indexOf(eventType) >= 0
            : logConfig.eventSelection === eventType;
      }

      if (isEnabled && !isNull(key) && logConfig.keys && logConfig.keys.length > 0) {
        isEnabled = logConfig.keys.indexOf(key) >= 0;
      }
    }

    return isEnabled;
  }
}
