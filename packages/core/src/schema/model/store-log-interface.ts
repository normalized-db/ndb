import { EventSelection, LogMode, ValidKey } from '../../model';

export interface IStoreLog {
  mode: LogMode;
  eventSelection?: EventSelection;
  keys?: ValidKey[];
}
