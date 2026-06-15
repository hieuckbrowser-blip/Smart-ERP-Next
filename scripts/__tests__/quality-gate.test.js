const path = require('node:path');
const {
  buildGatePlan,
  buildGateEnv,
  findMissingGateIds,
  formatSuccessMessage,
  resolveGateCommand,
} = require('../quality-gate');

describe('quality gate plan', () => {
  const originalSkipIos = process.env.SKIP_IOS_ARTIFACT;

  afterEach(() => {
    if (originalSkipIos === undefined) {
      delete process.env.SKIP_IOS_ARTIFACT;
    } else {
      process.env.SKIP_IOS_ARTIFACT = originalSkipIos;
    }
  });

  it('does not certify release readiness from unit coverage alone', () => {
    const plan = buildGatePlan('commit');
    const gateIds = plan.gates.map((gate) => gate.id);

    expect(gateIds).toEqual(['lint', 'test-layout', 'i18n-runtime', 'type-check', 'unit-coverage']);
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
      'i18n-runtime',
      'type-check',
      'unit-coverage',
      'web-build',
      'web-production-build',
      'desktop-build',
      'mobile-type-check',
      'e2e-assertion-audit',
      'api-e2e',
      'release-runtime-smoke',
      'web-e2e',
      'native-artifact-manifest',
    ]);

    expect(plan.gates.find((gate) => gate.id === 'desktop-build')).toEqual(
      expect.objectContaining({
        args: ['scripts/ensure-desktop-release-artifact.js'],
        command: 'node',
        name: 'Build or verify native Windows desktop installer',
      }),
    );
  });

  it('fails release certification when any release gate has no passing evidence', () => {
    const plan = buildGatePlan('release');
    const results = new Map([
      ['lint', { status: 'passed' }],
      ['test-layout', { status: 'passed' }],
      ['i18n-runtime', { status: 'passed' }],
      ['type-check', { status: 'passed' }],
      ['unit-coverage', { status: 'passed' }],
    ]);

    expect(findMissingGateIds(plan, results)).toEqual([
      'web-build',
      'web-production-build',
      'desktop-build',
      'mobile-type-check',
      'e2e-assertion-audit',
      'api-e2e',
      'release-runtime-smoke',
      'web-e2e',
      'native-artifact-manifest',
    ]);
  });

  it('does not claim iOS release readiness when iOS artifact is intentionally skipped', () => {
    process.env.SKIP_IOS_ARTIFACT = '1';

    expect(formatSuccessMessage(buildGatePlan('release'))).toContain('iOS artifact intentionally skipped');
    expect(formatSuccessMessage(buildGatePlan('release'))).toContain('iOS .ipa van la deferred release item');
  });

  it('keeps pnpm as the displayed gate command', () => {
    expect(resolveGateCommand({ command: 'pnpm', args: ['lint'] })).toEqual({
      command: 'pnpm',
      args: ['lint'],
      display: 'pnpm lint',
      shell: process.platform === 'win32',
    });
  });

  it('prepends repo-local shims so Turbo can find pnpm through Corepack', () => {
    const env = buildGateEnv('/repo');
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH';
    const sep = process.platform === 'win32' ? ';' : ':';

    expect(env[pathKey].split(sep)[0]).toMatch(/[/\\]repo[/\\]scripts[/\\]shims$/);
  });
});
