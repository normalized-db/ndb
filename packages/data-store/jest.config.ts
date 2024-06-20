import type { Config } from 'jest';
import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  displayName: 'ndb/data-store',
  preset: 'ts-jest',
  moduleDirectories: ['node_modules'],
};

export default config;
