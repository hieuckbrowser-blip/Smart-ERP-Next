const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const API_E2E_ROOT_REASON =
  'apps/api/test is reserved for API e2e specs (*.e2e-spec.ts) and approved e2e helpers';
const API_E2E_HELPERS = new Set(['uuid.mock.ts']);
const DISALLOWED_TEST_DIRECTORIES = [
  {
    relativePath: 'apps/api/__tests__',
    reason: 'use apps/api/src/__tests__ or colocated apps/api/src/**/*.spec.ts for API unit tests',
  },
  {
    relativePath: 'apps/api/tests',
    reason: 'use apps/api/test for Nest API e2e tests',
  },
];

function normalizeRepoPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function toRepoPath(filePath, repoRoot = REPO_ROOT) {
  return normalizeRepoPath(path.relative(repoRoot, filePath));
}

function walkFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function validateApiE2eTestFile(repoPath) {
  const file = normalizeRepoPath(repoPath);
  if (!file.startsWith('apps/api/test/')) return [];

  const basename = path.basename(file);
  if (basename.endsWith('.e2e-spec.ts') || API_E2E_HELPERS.has(basename)) {
    return [];
  }

  return [
    {
      file,
      reason: API_E2E_ROOT_REASON,
    },
  ];
}

function auditTestLayout(repoRoot = REPO_ROOT) {
  const findings = [];

  for (const directory of DISALLOWED_TEST_DIRECTORIES) {
    const fullPath = path.join(repoRoot, directory.relativePath);
    if (fs.existsSync(fullPath)) {
      findings.push({
        file: directory.relativePath,
        reason: directory.reason,
      });
    }
  }

  const apiE2eFiles = walkFiles(path.join(repoRoot, 'apps/api/test')).map((filePath) =>
    toRepoPath(filePath, repoRoot),
  );

  findings.push(...apiE2eFiles.flatMap(validateApiE2eTestFile));

  return findings;
}

function main() {
  const findings = auditTestLayout();

  if (findings.length > 0) {
    console.error('Test layout audit failed.');
    console.error('Test directories must map to exactly one runner and ownership model.');
    for (const finding of findings) {
      console.error(`- ${finding.file}: ${finding.reason}`);
    }
    return 1;
  }

  console.log('Test layout audit passed.');
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  API_E2E_ROOT_REASON,
  DISALLOWED_TEST_DIRECTORIES,
  auditTestLayout,
  validateApiE2eTestFile,
};
