import { EventSelection, LogMode } from '../../model';
import { ValidKey } from '../../model/index';
import { IStoreLogConfig } from '../model';

export class StoreLogBuilder {

  private readonly keys: ValidKey[];

  public constructor(private mode?: LogMode,
                     private eventSelection?: EventSelection,
                     keys?: ValidKey[] | Set<ValidKey>) {
    if (keys instanceof Set) {
      this.keys = [];
      keys.forEach(k => this.keys.push(k));
    } else if (Array.isArray(keys)) {
      this.keys = keys;
    } else {
      this.keys = [];
    }
  }

  public setMode(value: LogMode): StoreLogBuilder {
    this.mode = value;
    return this;
  }

  public setEventSelection(value: EventSelection): StoreLogBuilder {
    this.eventSelection = value;
    return this;
  }

  public addKey(value: ValidKey | ValidKey[]): StoreLogBuilder {
    if (Array.isArray(value)) {
      this.keys.push(...value);
    } else {
      this.keys.push(value);
    }
    return this;
  }

  public build(): IStoreLogConfig {
    const config: IStoreLogConfig = { mode: this.mode || 'disabled' };
    if (this.eventSelection) {
      config.eventSelection = this.eventSelection;
    }

    if (this.keys && this.keys.length > 0) {
      config.keys = this.keys;
    }

    return config;
  }
}
