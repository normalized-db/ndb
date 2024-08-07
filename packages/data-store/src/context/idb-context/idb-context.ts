import { IDenormalizerBuilder, INormalizerBuilder, ISchema } from '@normalized-db/normalizer';
import { type IDBPDatabase, openDB } from 'idb';
import { CommandFactory } from '../../command/command-factory';
import { IdbCommandFactory } from '../../command/idb-command/idb-command-factory';
import { IdbLogger } from '../../logging/idb-logging/idb-logger';
import { Logger } from '../../logging/logger';
import { DataStoreTypes } from '../../model/data-store-types';
import { IdbQueryRunnerFactory } from '../../query/runner/idb-runner/idb-query-runner-factory';
import { QueryRunnerFactory } from '../../query/runner/query-runner-factory';
import type { IdbReadTransaction, IdbWriteTransaction } from '../../utility/idb';
import { Context } from '../context';
import { IdbConfig } from './idb-config';

export class IdbContext<Types extends DataStoreTypes> extends Context<Types> {

  protected readonly _logger = new IdbLogger<Types>(this);

  protected _db: IDBPDatabase;

  constructor(schema: ISchema,
              normalizerBuilder: INormalizerBuilder,
              denormalizerBuilder: IDenormalizerBuilder,
              private readonly dbConfig: IdbConfig) {
    super(schema, normalizerBuilder, denormalizerBuilder);
    this.onUpgradeNeeded = this.onUpgradeNeeded.bind(this);
  }

  public isReady(): boolean {
    return !!this._db;
  }

  public async open(): Promise<void> {
    if (!this.isReady()) {
      const self = this;
      this._db = await openDB(this.dbConfig.name, this.dbConfig.version, {
        upgrade(database, oldVersion, newVersion, transaction, event) {
          if (self.dbConfig.upgrade) {
            self.dbConfig.upgrade(database, oldVersion, newVersion);
          } else {
            self.onUpgradeNeeded(database);
          }
        },
      });
    }
  }

  public async close(): Promise<void> {
    if (this.isReady()) {
      this._db.close();
      this._db = null;
    }
  }

  public queryRunnerFactory(): QueryRunnerFactory {
    return IdbQueryRunnerFactory.instance(this);
  }

  public commandFactory(): CommandFactory {
    return IdbCommandFactory.instance(this);
  }

  public logger(): Logger<Types, IdbContext<Types>> {
    return this._logger;
  }

  public async objectStoreNames(autoCloseContext = false): Promise<string[]> {
    await this.open();
    const osnList = this._db.objectStoreNames;
    const osnArray: string[] = [];
    for (let i = 0; i < osnList.length; i++) {
      osnArray.push(osnList.item(i));
    }

    if (autoCloseContext) {
      await this.close();
    }

    return osnArray;
  }

  public async read(stores: string | string[] = this._schema.getTypes()): Promise<IdbReadTransaction> {
    await this.open();
    return this._db.transaction(stores, 'readonly');
  }

  public async write(stores: string | string[] = this._schema.getTypes()): Promise<IdbWriteTransaction> {
    await this.open();
    return this._db.transaction(stores, 'readwrite');
  }

  private onUpgradeNeeded(upgradeDb: IDBPDatabase) {
    this._logger.onUpgradeNeeded(upgradeDb);
    this._schema.getTypes()
      .filter(type => !upgradeDb.objectStoreNames.contains(type))
      .forEach(type => {
        const config = this._schema.getConfig(type);
        upgradeDb.createObjectStore(type, { keyPath: config.key });
      });
  }
}
