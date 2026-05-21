const { spawnSync } = require('node:child_process');

const COMMON_GATES = [
  {
    id: 'lint',
    name: 'Lint all workspaces',
    command: 'pnpm',
    args: ['lint'],
  },
  {
    id: 'test-layout',
    name: 'Audit test directory ownership',
    command: 'pnpm',
    args: ['audit:test-layout'],
  },
  {
    id: 'type-check',
    name: 'Type-check all workspaces',
    command: 'pnpm',
    args: ['type-check'],
  },
  {
    id: 'unit-coverage',
    name: 'Jest unit/integration tests with configured coverage thresholds',
    command: 'pnpm',
    args: ['test:cov'],
  },
];

const RELEASE_ONLY_GATES = [
  {
    id: 'web-build',
    name: 'Build web MVP',
    command: 'pnpm',
    args: ['--filter', '@smart-erp/web', 'build'],
  },
  {
    id: 'desktop-build',
    name: 'Build native Windows desktop MVP',
    command: 'pnpm',
    args: ['--filter', '@smart-erp/desktop', 'build'],
  },
  {
    id: 'mobile-type-check',
    name: 'Type-check mobile native code',
    command: 'pnpm',
    args: ['--filter', '@smart-erp/mobile', 'type-check'],
  },
  {
    id: 'e2e-assertion-audit',
    name: 'Audit E2E tests for fake-pass assertions',
    command: 'pnpm',
    args: ['audit:e2e-assertions'],
  },
  {
    id: 'api-e2e',
    name: 'Run API end-to-end tests',
    command: 'pnpm',
    args: ['test:api:e2e'],
  },
  {
    id: 'web-e2e',
    name: 'Run Playwright end-user web flows',
    command: 'pnpm',
    args: ['test:e2e'],
  },
  {
    id: 'native-artifact-manifest',
    name: 'Verify native artifacts exist for Android, iOS, and Windows',
    command: 'pnpm',
    args: ['verify:native-artifacts'],
  },
];

function buildGatePlan(mode = 'commit') {
  if (mode === 'commit') {
    return {
      mode,
      certifiesRelease: false,
      gates: COMMON_GATES,
    };
  }

  if (mode === 'release') {
    return {
      mode,
      certifiesRelease: true,
      gates: [...COMMON_GATES, ...RELEASE_ONLY_GATES],
    };
  }

  throw new Error(`Unknown quality gate mode: ${mode}`);
}

function findMissingGateIds(plan, results) {
  return plan.gates
    .filter((gate) => results.get(gate.id)?.status !== 'passed')
    .map((gate) => gate.id);
}

function formatSuccessMessage(plan) {
  if (!plan.certifiesRelease) {
    return [
      'Commit quality gate passed.',
      'Day khong phai release certification: khong duoc claim 100% san sang phat hanh neu chua chay pnpm qa:release.',
    ].join('\n');
  }

  return [
    'Release quality gate passed.',
    'Co the claim release-ready vi tat ca gate unit, build, e2e, native artifact da co evidence pass.',
  ].join('\n');
}

function runGate(gate, cwd = process.cwd()) {
  console.log(`\n[quality-gate] ${gate.id}: ${gate.name}`);
  console.log(`[quality-gate] $ ${gate.command} ${gate.args.join(' ')}`);

  const result = spawnSync(gate.command, gate.args, {
    cwd,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  return {
    status: result.status === 0 ? 'passed' : 'failed',
    exitCode: result.status ?? 1,
  };
}

function runPlan(mode = 'commit', cwd = process.cwd()) {
  const plan = buildGatePlan(mode);
  const results = new Map();

  console.log('=================================================');
  console.log(`Smart ERP Next quality gate: ${plan.mode}`);
  console.log('=================================================');

  for (const gate of plan.gates) {
    const result = runGate(gate, cwd);
    results.set(gate.id, result);

    if (result.status !== 'passed') {
      console.error(`\n[quality-gate] FAILED: ${gate.id} exited with ${result.exitCode}`);
      console.error('[quality-gate] Khong duoc claim 100% hoan thanh khi gate nay chua pass.');
      return 1;
    }
  }

  const missingGateIds = findMissingGateIds(plan, results);
  if (missingGateIds.length > 0) {
    console.error(`[quality-gate] Missing passing evidence: ${missingGateIds.join(', ')}`);
    return 1;
  }

  console.log('\n' + formatSuccessMessage(plan));
  return 0;
}

if (require.main === module) {
  const mode = process.argv[2] || 'commit';
  process.exit(runPlan(mode));
}

module.exports = {
  buildGatePlan,
  findMissingGateIds,
  formatSuccessMessage,
  runGate,
  runPlan,
};
