import type { NdbDocument } from '@normalized-db/normalizer';

export interface User extends NdbDocument {
  readonly userName: string;
  readonly fullName: string;
}

export interface BlogPost extends NdbDocument {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly createdBy: User;
  readonly comments: BlogComment[];
}

export interface BlogComment extends NdbDocument {
  readonly id: string;
  readonly text: string;
  readonly createdBy: User;
}
