const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const alertsPath = path.join(__dirname, '..', '..', 'monitoring', 'prometheus', 'alerts.yml');

describe('Prometheus alert rules', () => {
  let doc;

  beforeAll(() => {
    const content = fs.readFileSync(alertsPath, 'utf8');
    doc = YAML.parse(content);
  });

  it('parses as a valid Prometheus rule file', () => {
    expect(doc).toHaveProperty('groups');
    expect(Array.isArray(doc.groups)).toBe(true);
    expect(doc.groups.length).toBeGreaterThan(0);
  });

  it('contains the smart-erp-api rule group', () => {
    const group = doc.groups.find(g => g.name === 'smart-erp-api');
    expect(group).toBeDefined();
    expect(Array.isArray(group.rules)).toBe(true);
  });

  it('has required alerts including SLO burn-rate alerts', () => {
    const group = doc.groups.find(g => g.name === 'smart-erp-api');
    const names = group.rules.map(r => r.alert);
    expect(names).toContain('SmartErpApiStatusDown');
    expect(names).toContain('SmartErpApiDatabaseUnhealthy');
    expect(names).toContain('SmartErpApiBurnRateFast');
    expect(names).toContain('SmartErpApiBurnRateSlow');
  });

  it('every rule has expr, labels and annotations', () => {
    const group = doc.groups.find(g => g.name === 'smart-erp-api');
    for (const rule of group.rules) {
      expect(rule.expr).toBeDefined();
      expect(rule.labels).toBeDefined();
      expect(rule.labels.severity).toMatch(/critical|warning|info/);
      expect(rule.annotations).toBeDefined();
      expect(rule.annotations.summary).toBeDefined();
      expect(rule.annotations.description).toBeDefined();
    }
  });
});
