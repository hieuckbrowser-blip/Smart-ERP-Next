const os = require('node:os');
const path = require('node:path');
const { buildTauriEnv } = require('../run-tauri-build');

describe('run-tauri-build wrapper', () => {
  it('prepends repo shims and Cargo bin for Tauri release builds', () => {
    const env = buildTauriEnv('/repo/apps/desktop');
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH';
    const sep = process.platform === 'win32' ? ';' : ':';
    const entries = env[pathKey].split(sep);

    expect(entries[0]).toMatch(/[/\\]repo[/\\]scripts[/\\]shims$/);
    expect(entries[1]).toBe(path.join(os.homedir(), '.cargo', 'bin'));
  });
});
