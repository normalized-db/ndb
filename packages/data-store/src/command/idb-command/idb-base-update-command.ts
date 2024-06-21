import { isNull, NdbDocument, NotFoundError } from '@normalized-db/normalizer';
import { IDBPObjectStore } from 'idb';
import { IdbBaseWriteCommand } from './idb-base-write-command';

export abstract class IdbBaseUpdateCommand<T extends NdbDocument> extends IdbBaseWriteCommand<T> {

  protected async executeHelper(data: T | T[], isPartialUpdate = false): Promise<boolean> {
    const objectStore = (await this._context.read(this._type)).objectStore(this._type);
    if (Array.isArray(data)) {
      await Promise.all(data.map(item => this.checkExistence(objectStore, item)));
    } else {
      await this.checkExistence(objectStore, data);
    }

    return super.write(data, null, isPartialUpdate);
  }

  private async checkExistence(objectStore: IDBPObjectStore, item: T): Promise<void> {
    const key = this.getKey(item);
    const existingItem = objectStore.get(key);
    if (isNull(existingItem)) {
      throw new NotFoundError(this._type, key);
    }
  }
}
