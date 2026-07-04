const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const repoRoot = path.join(__dirname, '..', '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const readYaml = (relativePath) => YAML.parse(read(relativePath));

describe('observability configuration', () => {
  it('defines Prometheus, Grafana, and Loki services', () => {
    const compose = readYaml('docker-compose.observability.yml');

    expect(Object.keys(compose.services).sort()).toEqual(['grafana', 'loki', 'prometheus']);
    expect(compose.services.prometheus.volumes).toContain('./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro');
    expect(compose.services.grafana.ports).toContain('3002:3000');
    expect(compose.services.loki.ports).toContain('3100:3100');
  });

  it('scrapes the Smart ERP status endpoint and loads alert rules', () => {
    const prometheus = readYaml('monitoring/prometheus/prometheus.yml');

    expect(prometheus.rule_files).toContain('/etc/prometheus/alerts.yml');
    expect(prometheus.scrape_configs[0].job_name).toBe('smart-erp-api-status');
    expect(prometheus.scrape_configs[0].metrics_path).toBe('/status/metrics');
  });

  it('provisions alert rules, datasources, and dashboards', () => {
    const alerts = readYaml('monitoring/prometheus/alerts.yml');
    const datasources = readYaml('monitoring/grafana/provisioning/datasources/datasources.yml');
    const dashboards = readYaml('monitoring/grafana/provisioning/dashboards/dashboards.yml');
    const dashboard = JSON.parse(read('monitoring/grafana/dashboards/smart-erp-overview.json'));

    expect(alerts.groups[0].rules.map((rule) => rule.alert)).toEqual([
      'SmartErpApiStatusDown',
      'SmartErpApiDatabaseUnhealthy',
      'SmartErpApiBurnRateFast',
      'SmartErpApiBurnRateSlow',
    ]);
    expect(datasources.datasources.map((datasource) => datasource.name)).toEqual(['Prometheus', 'Loki']);
    expect(dashboards.providers[0].options.path).toBe('/var/lib/grafana/dashboards');
    expect(dashboard.uid).toBe('smart-erp-overview');
  });
});
