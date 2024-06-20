import { type IDBPCursorWithValue, type IDBPObjectStore, type IDBPTransaction } from 'idb';

export type IdbReadTransaction = IDBPTransaction<unknown, string | string[], 'readonly'>;
export type IdbWriteTransaction = IDBPTransaction<unknown, string | string[], 'readwrite'>;

export type IdbReadStore<T extends string = string> = IDBPObjectStore<unknown, string | string[], T, 'readonly'>;
export type IdbWriteStore<T extends string = string> = IDBPObjectStore<unknown, string | string[], T, 'readwrite'>;

export type IdbReadCursor = IDBPCursorWithValue<unknown, string | string[], string, unknown, 'readonly'>;
export type IdbWriteCursor = IDBPCursorWithValue<unknown, string | string[], string, unknown, 'readwrite'>;
