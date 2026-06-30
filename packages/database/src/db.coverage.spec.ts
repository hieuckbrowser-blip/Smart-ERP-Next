import { resolve } from 'path';

type LoadDbOptions = {
  configSetsDatabaseUrl?: boolean;
  databaseUrl?: string;
  existingPaths?: string[];
  smartEnvPath?: string;
};

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalSmartEnvPath = process.env.SMART_ERP_API_ENV;

function restoreEnv() {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;

  if (originalSmartEnvPath === undefined) delete process.env.SMART_ERP_API_ENV;
  else process.env.SMART_ERP_API_ENV = originalSmartEnvPath;
}

function loadDb(options: LoadDbOptions = {}) {
  jest.resetModules();
  delete process.env.DATABASE_URL;
  delete process.env.SMART_ERP_API_ENV;

  if (options.databaseUrl) process.env.DATABASE_URL = options.databaseUrl;
  if (options.smartEnvPath) process.env.SMART_ERP_API_ENV = options.smartEnvPath;

  const existingPaths = new Set(options.existingPaths ?? []);
  const existsSync = jest.fn((envPath: string) => existingPaths.has(envPath));
  const config = jest.fn(({ path }: { path: string }) => {
    if (options.configSetsDatabaseUrl !== false) {
      process.env.DATABASE_URL = `postgres://loaded-from-${path}`;
    }

    return { parsed: {} };
  });
  const Pool = jest.fn().mockImplementation((options) => ({ options }));
  const drizzle = jest.fn((pool, drizzleOptions) => ({ pool, drizzleOptions }));

  jest.doMock('fs', () => ({ existsSync }));
  jest.doMock('dotenv', () => ({ config }));
  jest.doMock('pg', () => ({ Pool }));
  jest.doMock('drizzle-orm/node-postgres', () => ({ drizzle }));
  jest.doMock('./schema', () => ({ users: {} }));

  const dbModule = require('./db');

  return { Pool, config, dbModule, drizzle, existsSync };
}

describe('database connection bootstrap', () => {
  afterEach(() => {
    jest.dontMock('fs');
    jest.dontMock('dotenv');
    jest.dontMock('pg');
    jest.dontMock('drizzle-orm/node-postgres');
    jest.dontMock('./schema');
    restoreEnv();
  });

  it('uses an existing DATABASE_URL without probing env files', () => {
    const { Pool, config, existsSync } = loadDb({
      databaseUrl: 'postgres://existing',
    });

    expect(existsSync).not.toHaveBeenCalled();
    expect(config).not.toHaveBeenCalled();
    expect(Pool).toHaveBeenCalledWith(expect.objectContaining({ connectionString: 'postgres://existing' }));
  });

  it('loads the first existing env candidate before creating the pool', () => {
    const smartEnvPath = resolve(process.cwd(), 'custom.env');
    const { Pool, config, existsSync } = loadDb({
      existingPaths: [smartEnvPath],
      smartEnvPath,
    });

    expect(existsSync).toHaveBeenCalledWith(smartEnvPath);
    expect(config).toHaveBeenCalledWith({ path: smartEnvPath });
    expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: `postgres://loaded-from-${smartEnvPath}`,
    }));
  });

  it('continues probing when an env file does not provide DATABASE_URL', () => {
    const apiEnvPath = resolve(process.cwd(), 'apps/api/.env');
    const rootEnvPath = resolve(process.cwd(), '.env');
    const { Pool, config, existsSync } = loadDb({
      configSetsDatabaseUrl: false,
      existingPaths: [apiEnvPath, rootEnvPath],
    });

    expect(config).toHaveBeenCalledWith({ path: apiEnvPath });
    expect(config).toHaveBeenCalledWith({ path: rootEnvPath });
    expect(existsSync).toHaveBeenCalledWith(resolve(process.cwd(), '../../apps/api/.env'));
    expect(Pool).toHaveBeenCalledWith(expect.objectContaining({ connectionString: undefined }));
  });
});
