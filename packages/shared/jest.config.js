const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,
  // Override testDir if needed, but keep the same
  testDir: '<rootDir>',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
};