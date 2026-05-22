module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.service.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    '^@smart-erp/database/schema$': '<rootDir>/../../packages/database/src/schema/index.ts',
    '^@smart-erp/database/drizzle$': '<rootDir>/../../packages/database/src/drizzle.ts',
    '^@smart-erp/database$': '<rootDir>/../../packages/database/src/index.ts',
    '^@smart-erp/(.*)$': '<rootDir>/../../packages/$1/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/test/'],
};
