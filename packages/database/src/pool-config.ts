import { PoolConfig } from 'pg';

export function buildPoolConfig(connectionString?: string): PoolConfig {
  return {
    connectionString: connectionString || process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT ?? '5000', 10),
  };
}
