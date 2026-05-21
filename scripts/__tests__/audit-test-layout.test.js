const {
  API_E2E_ROOT_REASON,
  DISALLOWED_TEST_DIRECTORIES,
  validateApiE2eTestFile,
} = require('../audit-test-layout');

describe('test layout audit', () => {
  it('blocks ambiguous API root-level test directories', () => {
    expect(DISALLOWED_TEST_DIRECTORIES).toEqual([
      {
        relativePath: 'apps/api/__tests__',
        reason: 'use apps/api/src/__tests__ or colocated apps/api/src/**/*.spec.ts for API unit tests',
      },
      {
        relativePath: 'apps/api/tests',
        reason: 'use apps/api/test for Nest API e2e tests',
      },
    ]);
  });

  it('allows API e2e specs and approved e2e helpers in apps/api/test', () => {
    expect(validateApiE2eTestFile('apps/api/test/core-journey.e2e-spec.ts')).toEqual([]);
    expect(validateApiE2eTestFile('apps/api/test/uuid.mock.ts')).toEqual([]);
  });

  it('flags non-e2e tests placed in apps/api/test', () => {
    expect(validateApiE2eTestFile('apps/api/test/products.service.spec.ts')).toEqual([
      {
        file: 'apps/api/test/products.service.spec.ts',
        reason: API_E2E_ROOT_REASON,
      },
    ]);
  });
});
