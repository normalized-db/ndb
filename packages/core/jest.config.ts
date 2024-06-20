import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  displayName: 'ndb/core',
  preset: 'ts-jest',
  moduleDirectories: ['node_modules'],
};

export default config;
