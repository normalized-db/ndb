import { NdbDocument } from '@normalized-db/normalizer';

export type MapFunc<Input extends NdbDocument, Result> =
    (item: Input, idx: number, array: Input[]) =>
        Result | Promise<Result>;
