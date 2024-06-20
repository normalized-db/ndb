import { ValidKey } from './valid-key';

export declare type UniqueKeyCallback = (type: string) => ValidKey | Promise<ValidKey>;
