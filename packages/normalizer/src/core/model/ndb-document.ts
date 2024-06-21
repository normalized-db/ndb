import { ReverseReferences } from './reverse-references';

export interface NdbDocument {
  readonly _refs?: ReverseReferences;
}
