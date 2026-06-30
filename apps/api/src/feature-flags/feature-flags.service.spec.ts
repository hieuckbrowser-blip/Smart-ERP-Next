import { FeatureFlagsService } from './feature-flags.service';

jest.mock('@smart-erp/database', () => ({ db: { select: jest.fn(), insert: jest.fn(), update: jest.fn() } }));
jest.mock('@smart-erp/database/schema', () => ({ featureFlags: {} }));
jest.mock('@smart-erp/database/drizzle', () => ({ eq: jest.fn((x) => x), and: jest.fn((...args) => args) }));

const { db } = jest.requireMock('@smart-erp/database') as { db: any };

describe('FeatureFlagsService with cache', () => {
  let service: FeatureFlagsService;

  beforeEach(() => {
    jest.clearAllMocks();
    db.select.mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) });
    service = new FeatureFlagsService();
  });

  it('returns cached value on second call within TTL', async () => {
    db.select.mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ flagKey: 'new_pos', enabled: true }]) }) });
    const first = await service.isEnabled('t1', 'new_pos');
    const second = await service.isEnabled('t1', 'new_pos');
    expect(first).toBe(true);
    expect(second).toBe(true);
    // Second call should use cache, not DB
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache after TTL expires (via clearCache)', async () => {
    db.select
      .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ flagKey: 'f1', enabled: true }]) }) })
      .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ flagKey: 'f1', enabled: false }]) }) });

    await service.isEnabled('t1', 'f1');
    service.clearCache('t1');
    const result = await service.isEnabled('t1', 'f1');
    expect(result).toBe(false);
    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it('clears cache entry on setFlag', async () => {
    db.select
      .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ id: 'existing', flagKey: 'f1', enabled: true }]) }) })
      .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ flagKey: 'f1', enabled: false }]) }) });
    db.update.mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }) });

    await service.setFlag('t1', 'f1', false, 'admin');
    const result = await service.isEnabled('t1', 'f1');
    expect(result).toBe(false);
    expect(db.select).toHaveBeenCalledTimes(2);
  });
});
