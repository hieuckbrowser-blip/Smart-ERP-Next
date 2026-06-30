const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

describe('Docker image optimization', () => {
  const dockerfile = join(__dirname, '..', '..', 'Dockerfile');
  const dockerignore = join(__dirname, '..', '..', '.dockerignore');

  it('Dockerfile exists', () => {
    expect(existsSync(dockerfile)).toBe(true);
  });

  it('.dockerignore exists', () => {
    expect(existsSync(dockerignore)).toBe(true);
  });

  it('Dockerfile uses multi-stage build', () => {
    const content = readFileSync(dockerfile, 'utf8');
    const stages = content.match(/^FROM /gm);
    expect(stages.length).toBeGreaterThanOrEqual(2);
  });

  it('Dockerfile removes build artifacts in runtime stage', () => {
    const content = readFileSync(dockerfile, 'utf8');
    expect(content).toContain('rm -rf');
    expect(content).toContain('.pnpm-store');
  });

  it('Dockerfile has OCI labels', () => {
    const content = readFileSync(dockerfile, 'utf8');
    expect(content).toContain('org.opencontainers.image');
  });

  it('Dockerfile has HEALTHCHECK', () => {
    const content = readFileSync(dockerfile, 'utf8');
    expect(content).toContain('HEALTHCHECK');
  });
});
