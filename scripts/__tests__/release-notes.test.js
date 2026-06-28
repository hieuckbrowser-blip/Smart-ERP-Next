const fs = require('fs');
const path = require('path');

describe('Release Notes Generation', () => {
  const repoRoot = path.resolve(__dirname, '../..');

  test('release.yml has fetch-depth: 0 for proper commit history', () => {
    const content = fs.readFileSync(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
    expect(content).toContain('fetch-depth: 0');
  });

  test('generate-release-notes.js exists', () => {
    expect(fs.existsSync(path.join(repoRoot, 'scripts/generate-release-notes.js'))).toBe(true);
  });

  test('release workflow creates a release with proper title', () => {
    const content = fs.readFileSync(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
    expect(content).toContain('--title "Smart ERP Next');
  });
});
