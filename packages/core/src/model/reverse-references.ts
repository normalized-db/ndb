import { ValidKey } from './valid-key';

export interface ReverseReferences {
  [type: string]: Set<ValidKey>;
}
