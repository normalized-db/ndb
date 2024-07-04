# @normalized-db/normalizer

Normalize `JavaScript` objects based on a simple schema (implemented with `TypeScript`).

## Versioning

To ease versioning equal major and minor version numbers are used for all modules.

## Installation

Install using NPM:

    npm install --save @normalized-db/normalizer

## Usage

### Schema

Normalization and denormalization both depend on a schema describing the basic data-structure which should be transformed.
A schema is a readonly object which is either created using a `SchemaConfig`-object or the `SchemaBuilder` which internally
also builds a `SchemaConfig`-object. The config object must implement the `ISchemaConfig`-interface.

#### Types

A schema may consist of three different kinds of object-store "types" or "stores" respectively:

- `@defaults`: Default configuration for every object-store.

- `@[storeName]`: Types prefixed with an `@` are handled as abstract types. The `@defaults`-store is also abstract.
  These stores can be used if two or more concrete stores share some configurations but no instances are needed.

- `[storeName]`: Concrete stores which either reuse the defaults only, inherit from an abstract store or another
  concrete store. Optionally defines or overrides specific configurations.

If a type only needs the defaults define it by `[storeName]: true`, if it inherits from another store but does not
have an own configuration define it by `[storeName]: "[parentStore]"`. More complex configurations may define the
following options:

- `parent` (string): The abstract / concrete type from which this type should inherit predefined configurations.

- [required] `key` (string): The name of a field which contains the unique identifier of this object. The value of this
  field is used to identify objects of this type. If two objects have the same key they are assumed to be equal.
  The value must be a `ValidKey` (`number`, `string` or `Date`).

- `targets` (string or `PropertiesConfig`): This is the most important option for (de)normalization.
  It defines which field of an object contains an object that should be (de)normalized into/from another type.
  The config value either is a `string` - then it must be the name of an explicitly declared concrete type, or it is a
  `PropertiesConfig`-object which in return also declares the target type (`type`-option) and optionally the
  `isArray` and `cascadeRemoval` boolean flags.

- `datastore.autoKey` (boolean): If set to `true`, this option tells data stores to automatically generate a unique identifier
  for new objects without a key.

- `datastore.logging` (`StoreLogConfig`): By using this option you can enable automatic logging for the store's entities.
  The required `mode`-field specifies the mode, whereas `Disabled` is used to disable logging at all,
  `Simple` enables logging but includes only some meta information on the change including store, primary key,
  type of change (e.g. `created` or `removed`) and `Full` basically does the same as `Simple` but it includes
  the changed object. So deciding whether to use `Simple` or `Full` is equal to making a trade-off between loss of
  information and a large logging store.
  By default, logging is disabled for each store which does not explicitly enable it or does not derive another
  preference from one of its parents. This of course can be changed by setting another mode in the `@defaults`-store
  (as it can be seen in the example below).
  The `eventSelection` can be optionally used to filter the events which should be logged.

An example for such a `SchemaConfig`-object for a simple blog could look like this (see the domain-specific type definitions below):

```typescript
const schemaConfig: SchemaConfig<DemoStructure, AbstractDemoSchema> = {
  '@defaults': {
    key: 'id',
    autoKey: true,
    dataStore: {
      logging: { mode: LogMode.Disabled },
    },
  },
  '@authored': {
    targets: {
      author: 'user',
    },
    logging: { mode: LogMode.Full },
  },
  role: true,
  user: {
    key: 'userName',
    targets: {
      role: 'role',
    },
    datastore: {
      autoKey: false,
      logging: {
        eventSelection: ['created', 'removed'],
      },
    },
  },
  blogPost: {
    parent: '@authored',
    targets: {
      comments: {
        type: 'comment',
        isArray: true,
        cascadeRemoval: true,
      },
    },
  },
  comment: '@authored',
};
```

Domain-specific type definitions:

```typescript
export interface UserRole {
  readonly id: number;
  readonly name: string;
}

export interface User {
  readonly createdAt: Date;
  readonly name: string;
  readonly userName: string;
  readonly role: UserRole;
}

export interface BlogPost {
  readonly id: number;
  readonly title: string;
  readonly author: User;
  readonly comments: Comment[];
}

export interface Comment {
  readonly id: number;
  readonly text: string;
  readonly author: User;
}

export interface DemoStructure extends SchemaStructure {
  role: UserRole;
  user: User;
  blogPost: BlogPost;
  comment: Comment;
}

export interface AbstractDemoSchema extends AbstractSchemaStructure {
  baseAuthor: BlogPost & Comment;
}
```

A possible input for normalizing blog posts might look like this:

```typescript
const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Title 1',
    author: {
      userName: 'user1',
      email: 'user1@mail.com',
      role: { id: 1, label: 'role1' }
    },
    comments: [
      {
        id: 1,
        text: 'Comment 1',
        author: {
          userName: 'user2',
          email: 'user2@mail.com',
          role: { id: 2, label: 'role2' }
        }
      }
    ]
  },
  {
    id: 2,
    title: 'Title 2',
    author: {
      userName: 'user2',
      email: 'user2@mail.com',
      role: { id: 2, label: 'role2' }
    }
  },
  {
    id: 3,
    title: 'Title 3',
    author: {
      userName: 'user3',
      email: 'user3@mail.com',
      role: { id: 3, label: 'role3'}
    },
    comments: [
      {
        id: 2,
        text: 'Comment 2',
        author: {
          userName: 'user2',
          email: 'user2@mail.com',
          role: { id: 2, label: 'role2' }
        }
      },
      {
        id: 3,
        text: 'Comment 3',
        author: {
          userName: 'user3',
          email: 'user3@mail.com',
          role: { id: 3, label: 'role3' }
        }
      }
    ]
  }
]
```

This then can be normalized using `normalize('blogPosts', blogPosts)`:

```typescript
const { normalize } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);
const result = normalize('blogPosts', blogPosts);
console.log(result);
```

Yielding this normalized and much simpler structure:

```typescript
const output: NormalizedData<DemoStructure> = {
  keyMap: { /* … */ },
  tree: { /* … */ },
  entities: {
    role: [
      { id: 1, label: 'role1' },
      { id: 2, label: 'role2' },
      { id: 3, label: 'role3' },
    ],
    user: [
      { userName: 'user1', email: 'user1@mail.com', role: 1 },
      { userName: 'user2', email: 'user2@mail.com', role: 2 },
      { userName: 'user3', email: 'user3@mail.com', role: 3 },
    ],
    blogPost: [
      { id: 1, title: 'Title 1', author: 'user1', comments: [1] },
      { id: 2, title: 'Title 2', author: 'user2' },
      { id: 3, title: 'Title 3', author: 'user3', comments: [2, 3] },
    ],
    comment: [
      { id: 1, text: 'Comment 1', author: 2 },
      { id: 2, text: 'Comment 2', author: 2 },
      { id: 3, text: 'Comment 3', author: 3 },
    ],
  },
}
```

The above structure also includes a little bit of meta information to enable some performance improvements in the denormalization process.
If you have the entire normalized structure ready, you can just pass it as is to the denormalizer function.

To restore the blog post with ID=`1`, use:

```typescript
const { normalizer, denormalizer } = normalizedDb<DemoStructure, AbstractDemoSchema>(schemaConfig);

const normalizedData = normalize('blogPosts', blogPosts);

const blogPost1: BlogPost = denormalizer
  .withData(normalizedData)
    .ofType('blogPost')
    .fromKey(1);
```

If you need to restore data, e.g. from *IndexedDB*, you need to store the `NormalizedData.tree` property somewhere, e.g. serialize it
into web storage. Then, use `preload()` instead of `withData()`. This will use the meta information from the tree to determine the
entity types and respective unique keys required for restoring a particular slice of the original data structure.

Keep in mind, that the tree data has to be merged everytime new data is normalized. You can use `Objects.merge()` to do so.

## Design considerations
Note that normalization is not the solution to everything. In fact, in many cases it would be absolutely redundant to
normalize an object. Take the `user.role` from the example above - the roles are basically just a string, the only object
which ever contains a role object is a user, and probably it is not possible to edit the role's name.
In such a case the normalization overhead probably is not worth it. Basically it is recommended to design the schema
rather passive - less can be more, so if normalizing a field is not necessary then do not normalize.

## Examples

See the [examples](https://github.com/normalized-db/ndb/tree/main/examples) for demo apps.
