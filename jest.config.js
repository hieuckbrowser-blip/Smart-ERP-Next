module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  collectCoverage: true,
  collectCoverageFrom: ['apps/**/*.ts', 'packages/**/*.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^@smart-erp/database/schema$': '<rootDir>/packages/database/src/schema/index.ts',
    '^@smart-erp/database/drizzle$': '<rootDir>/packages/database/src/drizzle.ts',
    '^@smart-erp/database$': '<rootDir>/packages/database/src/index.ts',
    '^@smart-erp/(.*)$': '<rootDir>/packages/$1/src/index.ts',
  },
  // Run a global setup that imports every source file to force coverage
  // globalSetup: './tests/global-setup.ts', // Commented out - file doesn't exist
};