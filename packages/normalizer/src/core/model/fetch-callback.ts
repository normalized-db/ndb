import { NdbDocument } from './ndb-document';
import { ValidKey } from './valid-key';

export declare type FetchCallback = (type: string, key: ValidKey) => NdbDocument | Promise<NdbDocument>;
