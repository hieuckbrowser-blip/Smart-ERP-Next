const {
  buildGatePlan,
  findMissingGateIds,
  formatSuccessMessage,
} = require('../quality-gate');

describe('quality gate plan', () => {
  it('does not certify release readiness from unit coverage alone', () => {
    const plan = buildGatePlan('commit');
    const gateIds = plan.gates.map((gate) => gate.id);

    expect(gateIds).toEqual(['lint', 'test-layout', 'type-check', 'unit-coverage']);
    expect(plan.certifiesRelease).toBe(false);
    expect(formatSuccessMessage(plan)).toContain('khong phai release certification');
  });

  it('requires cross-platform and end-user gates before release certification', () => {
    const plan = buildGatePlan('release');
    const gateIds = plan.gates.map((gate) => gate.id);

    expect(plan.certifiesRelease).toBe(true);
    expect(gateIds).toEqual([
      'lint',
      'test-layout',
      'type-check',
      'unit-coverage',
      'web-build',
      'desktop-build',
      'mobile-type-check',
      'e2e-assertion-audit',
      'api-e2e',
      'web-e2e',
      'native-artifact-manifest',
    ]);
  });

  it('fails release certification when any release gate has no passing evidence', () => {
    const plan = buildGatePlan('release');
    const results = new Map([
      ['lint', { status: 'passed' }],
      ['test-layout', { status: 'passed' }],
      ['type-check', { status: 'passed' }],
      ['unit-coverage', { status: 'passed' }],
    ]);

    expect(findMissingGateIds(plan, results)).toEqual([
      'web-build',
      'desktop-build',
      'mobile-type-check',
      'e2e-assertion-audit',
      'api-e2e',
      'web-e2e',
      'native-artifact-manifest',
    ]);
  });
});
