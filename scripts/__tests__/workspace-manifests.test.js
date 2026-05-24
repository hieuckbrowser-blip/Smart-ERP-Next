const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..', '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

describe('workspace package manifests', () => {
  it('declares Node types for workspace tests that use Node globals', () => {
    const manifest = readJson('packages/hooks/package.json');

    expect(manifest.devDependencies).toHaveProperty('@types/node');
  });

  it('keeps root Jest TypeScript options compatible with the CI compiler', () => {
    const jestConfig = require(path.join(repoRoot, 'jest.config.js'));
    const transform = jestConfig.transform['^.+\\.(ts|tsx|js|jsx)$'];

    expect(transform[1].tsconfig.ignoreDeprecations).toBe('5.0');
  });

  it('declares a root TypeScript version for Jest transforms', () => {
    const manifest = readJson('package.json');

    expect(manifest.devDependencies).toHaveProperty('typescript', '5.9.3');
  });
});
