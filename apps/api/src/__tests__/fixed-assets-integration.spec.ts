jest.mock('@smart-erp/database', () => {
  const db: any = () => db;
  const chainFn = jest.fn(() => db);

  db.select = chainFn;
  db.from = chainFn;
  db.where = chainFn;
  db.orderBy = chainFn;
  db.limit = chainFn;
  db.offset = chainFn;
  db.insert = chainFn;
  db.values = chainFn;
  db.update = chainFn;
  db.set = chainFn;
  db.delete = chainFn;
  db.execute = jest.fn();
  db.returning = jest.fn();
  db.then = jest.fn();

  return { db };
});

jest.mock('@smart-erp/database/schema', () => ({
  fixedAssets: {},
  fixedAssetDepreciationLogs: {},
}));

jest.mock('@smart-erp/database/drizzle', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  sql: jest.fn(),
  desc: jest.fn(),
  lt: jest.fn(),
  or: jest.fn(),
  isNull: jest.fn(),
}));

import { NotFoundException } from '@nestjs/common';
import { db } from '@smart-erp/database';
import { FixedAssetsService } from '../fixed-assets/services/fixed-assets.service';

describe('FixedAssetsService', () => {
  let service: FixedAssetsService;
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (db as any).then.mockImplementation((resolve: any) => resolve([]));
    (db as any).returning.mockReset();
    (db as any).returning.mockResolvedValue([]);
    (db as any).execute.mockReset();
    (db as any).execute.mockResolvedValue({ rows: [] });
    service = new (FixedAssetsService as any)();
  });

  const FAKE_ASSET = {
    id: 'asset-1',
    tenantId: TENANT_ID,
    name: 'Laptop',
    category: 'IT Equipment',
    status: 'active',
    purchaseCost: '2000',
    residualValue: '200',
    usefulLifeMonths: 36,
    accumulatedDepreciation: '0',
    lastDepreciationDate: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  describe('create', () => {
    it('creates a fixed asset', async () => {
      const dto = { name: 'Laptop', category: 'IT Equipment', purchaseCost: '2000', residualValue: '200', usefulLifeMonths: 36 };
      (db as any).returning.mockResolvedValue([FAKE_ASSET]);

      const result = await service.create(TENANT_ID, dto);

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ ...dto, tenantId: TENANT_ID }));
      expect(result).toEqual(FAKE_ASSET);
    });

    it('creates with minimal fields', async () => {
      const dto = { name: 'Chair', purchaseCost: '500', usefulLifeMonths: 60 };
      const minimalAsset = { ...FAKE_ASSET, name: 'Chair', purchaseCost: '500', usefulLifeMonths: 60 };
      (db as any).returning.mockResolvedValue([minimalAsset]);

      const result = await service.create(TENANT_ID, dto);

      expect(result.name).toBe('Chair');
    });
  });

  describe('findAll', () => {
    it('returns paginated assets with defaults', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([FAKE_ASSET]));

      const result = await service.findAll(TENANT_ID, {});

      expect(result.items).toEqual([FAKE_ASSET]);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('filters by category', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([FAKE_ASSET]));

      const result = await service.findAll(TENANT_ID, { category: 'IT Equipment' });

      expect(result.items).toHaveLength(1);
    });

    it('filters by status', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([]));

      const result = await service.findAll(TENANT_ID, { status: 'disposed' });

      expect(result.items).toEqual([]);
    });

    it('filters by category and status together', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([FAKE_ASSET]));

      const result = await service.findAll(TENANT_ID, { category: 'IT Equipment', status: 'active' });

      expect(result.items).toHaveLength(1);
    });

    it('respects custom page and limit', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([FAKE_ASSET]));

      const result = await service.findAll(TENANT_ID, { page: 2, limit: 5 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('caps limit at 100', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([]));

      const result = await service.findAll(TENANT_ID, { limit: 999 });

      expect(result.limit).toBe(100);
    });

    it('returns empty array when no assets match', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([]));

      const result = await service.findAll(TENANT_ID, { category: 'NonExistent' });

      expect(result.items).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns an asset by id', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([FAKE_ASSET]));

      const result = await service.findOne(TENANT_ID, 'asset-1');

      expect(result).toEqual(FAKE_ASSET);
    });

    it('throws NotFoundException when asset not found', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([]));

      await expect(service.findOne(TENANT_ID, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('runMonthlyDepreciation', () => {
    const firstDay = new Date(2026, 4, 1); // May 1, 2026

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-05-21T03:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('processes depreciation for active assets not yet depreciated this month', async () => {
      const asset = {
        ...FAKE_ASSET,
        purchaseCost: '2400',
        residualValue: '0',
        usefulLifeMonths: 24,
        accumulatedDepreciation: '0',
        lastDepreciationDate: null,
      };
      const logEntry = { id: 'log-1', assetId: asset.id, amount: '100', depreciationDate: new Date('2026-05-21') };

      (db as any).then
        .mockReset()
        .mockImplementationOnce((resolve: any) => resolve([asset]))
        .mockImplementation((resolve: any) => resolve(undefined));
      (db as any).returning.mockReset();
      (db as any).returning.mockResolvedValue([logEntry]);
      (db as any).update.mockReturnThis();

      const result = await service.runMonthlyDepreciation(TENANT_ID);

      expect(result.processed).toBe(1);
      expect(result.logs).toEqual([logEntry]);
    });

    it('skips assets with zero useful life', async () => {
      const asset = { ...FAKE_ASSET, usefulLifeMonths: 0 };
      (db as any).then.mockReset();
      (db as any).then.mockImplementation((resolve: any) => resolve([asset]));

      const result = await service.runMonthlyDepreciation(TENANT_ID);

      expect(result.processed).toBe(0);
    });

    it('skips assets already depreciated this month', async () => {
      (db as any).then.mockReset();
      (db as any).then.mockImplementation((resolve: any) => resolve([]));

      const result = await service.runMonthlyDepreciation(TENANT_ID);

      expect(result.processed).toBe(0);
    });

    it('processes multiple assets', async () => {
      const asset1 = { ...FAKE_ASSET, id: 'a-1', purchaseCost: '1200', residualValue: '0', usefulLifeMonths: 12, accumulatedDepreciation: '0', lastDepreciationDate: null };
      const asset2 = { ...FAKE_ASSET, id: 'a-2', purchaseCost: '600', residualValue: '0', usefulLifeMonths: 12, accumulatedDepreciation: '0', lastDepreciationDate: null };
      const log1 = { id: 'log-1', assetId: 'a-1', amount: '100' };
      const log2 = { id: 'log-2', assetId: 'a-2', amount: '50' };

      (db as any).then
        .mockReset()
        .mockImplementationOnce((resolve: any) => resolve([asset1, asset2]))
        .mockImplementation((resolve: any) => resolve(undefined));
      const returningMock = jest.fn()
        .mockResolvedValueOnce([log1])
        .mockResolvedValueOnce([log2]);
      (db as any).returning = returningMock;

      const result = await service.runMonthlyDepreciation(TENANT_ID);

      expect(result.processed).toBe(2);
    });
  });

  describe('dispose', () => {
    it('disposes an active asset', async () => {
      const disposed = { ...FAKE_ASSET, status: 'disposed' };
      (db as any).returning.mockResolvedValue([disposed]);

      const result = await service.dispose(TENANT_ID, 'asset-1');

      expect(result.status).toBe('disposed');
    });

    it('throws NotFoundException when asset does not exist', async () => {
      (db as any).returning.mockResolvedValue([]);

      await expect(service.dispose(TENANT_ID, 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
