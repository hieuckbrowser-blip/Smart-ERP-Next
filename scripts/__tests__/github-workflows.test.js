const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

function readWorkflow(name) {
  return fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', name), 'utf8');
}

function readWorkflowNames() {
  return fs
    .readdirSync(path.join(__dirname, '..', '..', '.github', 'workflows'))
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'));
}

describe('GitHub workflow definitions', () => {
  it('keeps the release workflow valid YAML', () => {
    const workflow = readWorkflow('release.yml');
    const doc = YAML.parseDocument(workflow, { prettyErrors: true });

    expect(doc.errors).toEqual([]);
  });

  it('does not bypass release coverage or quality gate failures', () => {
    const workflow = readWorkflow('release.yml');

    expect(workflow).toContain('pnpm qa:release');
    expect(workflow).not.toMatch(/\|\|\s*echo/i);
    expect(workflow).not.toContain('continuing release build');
  });

  it('runs CI on the default branch and uses the project E2E command', () => {
    const workflow = readWorkflow('ci.yml');
    const doc = YAML.parse(workflow);

    expect(doc.on.push.branches).toContain('master');
    expect(doc.on.pull_request.branches).toContain('master');
    expect(workflow).toContain('pnpm test:e2e');
    expect(workflow).not.toContain('npx playwright test');
  });

  it('uses packageManager as the single pnpm version source', () => {
    for (const workflowName of readWorkflowNames()) {
      const doc = YAML.parse(readWorkflow(workflowName));

      for (const job of Object.values(doc.jobs)) {
        for (const step of job.steps) {
          if (step.uses?.startsWith('pnpm/action-setup@')) {
            expect(step.with?.version).toBeUndefined();
          }
        }
      }
    }
  });

  it('uses a Node version compatible with workspace dependencies', () => {
    for (const workflowName of readWorkflowNames()) {
      const doc = YAML.parse(readWorkflow(workflowName));

      for (const job of Object.values(doc.jobs)) {
        for (const step of job.steps) {
          if (step.uses?.startsWith('actions/setup-node@')) {
            expect(String(step.with?.['node-version'])).toBe('22');
          }
        }
      }
    }
  });
});
