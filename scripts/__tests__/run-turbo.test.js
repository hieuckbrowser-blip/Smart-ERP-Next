const path = require('node:path');
const { buildTurboEnv } = require('../run-turbo');

describe('run-turbo wrapper', () => {
  it('prepends repo-local pnpm shims for Turbo package manager discovery', () => {
    const env = buildTurboEnv('/repo');
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH';
    const sep = process.platform === 'win32' ? ';' : ':';

    expect(env[pathKey].split(sep)[0]).toMatch(/[/\\]repo[/\\]scripts[/\\]shims$/);
  });
});
