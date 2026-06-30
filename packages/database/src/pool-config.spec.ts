import { buildPoolConfig } from './pool-config';

describe('buildPoolConfig', () => {
  afterEach(() => {
    delete process.env.DB_POOL_MAX;
    delete process.env.DB_POOL_IDLE_TIMEOUT;
    delete process.env.DB_POOL_CONNECTION_TIMEOUT;
  });

  it('returns defaults when no env vars set', () => {
    const config = buildPoolConfig();
    expect(config.max).toBe(20);
    expect(config.idleTimeoutMillis).toBe(30000);
    expect(config.connectionTimeoutMillis).toBe(5000);
  });

  it('reads max pool size from env', () => {
    process.env.DB_POOL_MAX = '10';
    const config = buildPoolConfig();
    expect(config.max).toBe(10);
  });

  it('reads idle timeout from env', () => {
    process.env.DB_POOL_IDLE_TIMEOUT = '60000';
    const config = buildPoolConfig();
    expect(config.idleTimeoutMillis).toBe(60000);
  });

  it('reads connection timeout from env', () => {
    process.env.DB_POOL_CONNECTION_TIMEOUT = '10000';
    const config = buildPoolConfig();
    expect(config.connectionTimeoutMillis).toBe(10000);
  });

  it('returns valid PoolConfig object', () => {
    const config = buildPoolConfig();
    expect(config).toHaveProperty('max');
    expect(config).toHaveProperty('idleTimeoutMillis');
    expect(config).toHaveProperty('connectionTimeoutMillis');
  });
});
