import { ValidKey } from './valid-key';

export interface KeyMap {
  [type: string]: Map<ValidKey, number>;
}
