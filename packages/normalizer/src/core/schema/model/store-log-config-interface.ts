import { EventSelection, LogMode } from '../../model';
import { ValidKey } from '../../model/index';

export interface IStoreLogConfig {
  mode: LogMode;
  eventSelection?: EventSelection;
  keys?: ValidKey[];
}
