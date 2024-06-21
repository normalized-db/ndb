import { ValidKey } from '@normalized-db/normalizer';
import { Parent } from '../../model/parent';
import { Predicate } from '../../model/predicate';
import { LogAction } from '../model/log-action';
import { LogEntry } from '../model/log-entry';

export class LogQueryConfig {

  public dateRange: IDBKeyRange;
  public type: string;
  public key: ValidKey;
  public action: LogAction;
  public parent: Parent;
  public filter: Predicate<LogEntry<any>>;
}
