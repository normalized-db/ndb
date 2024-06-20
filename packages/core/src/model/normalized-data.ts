import { NdbDocument } from './ndb-document';

export interface NormalizedData {
  [type: string]: NdbDocument[];
}
