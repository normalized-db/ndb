import { type IDBPDatabase } from 'idb';

export interface IdbConfig {
  name: string;
  version: number;
  upgrade?: (db: IDBPDatabase, oldVersion: number, newVersion: number) => void;
}
