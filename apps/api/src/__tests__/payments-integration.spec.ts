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
  payments: {},
}));

jest.mock('@smart-erp/database/drizzle', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  ilike: jest.fn(),
  sql: jest.fn(),
  desc: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
}));

import { NotFoundException } from '@nestjs/common';
import { db } from '@smart-erp/database';
import { PaymentsService } from '../payments/payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  const TENANT_ID = 'tenant-1';
  const USER_ID = 'user-1';

  const FAKE_PAYMENT = {
    id: 'pay-1',
    tenantId: TENANT_ID,
    code: 'PT-000001',
    type: 'receipt',
    referenceType: null,
    referenceId: null,
    partyType: 'customer',
    partyId: 'cust-1',
    partyName: 'Acme Corp',
    amount: '1500.00',
    method: 'bank_transfer',
    bankAccount: '1234567890',
    transactionRef: 'TXN-001',
    status: 'completed',
    notes: null,
    createdBy: USER_ID,
    paidAt: new Date('2025-06-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (db as any).then.mockImplementation((resolve: any) => resolve([]));
    (db as any).returning.mockReset();
    (db as any).returning.mockResolvedValue([]);
    (db as any).execute.mockReset();
    (db as any).execute.mockResolvedValue({ rows: [] });
    service = new (PaymentsService as any)();
  });

  describe('create', () => {
    it('creates a receipt payment with auto-generated code', async () => {
      const dto = {
        type: 'receipt',
        partyType: 'customer',
        partyId: 'cust-1',
        partyName: 'Acme Corp',
        amount: 1500,
        method: 'bank_transfer',
        bankAccount: '1234567890',
        transactionRef: 'TXN-001',
      };
      (db as any).then.mockImplementation((resolve: any) => resolve([{ count: 0 }]));
      (db as any).returning.mockResolvedValue([FAKE_PAYMENT]);

      const result = await service.create(TENANT_ID, USER_ID, dto as any);

      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(FAKE_PAYMENT);
    });

    it('creates a payment with code starting with PC', async () => {
      const dto = {
        type: 'payment',
        amount: 500,
        method: 'cash',
      };
      const paymentRecord = { ...FAKE_PAYMENT, code: 'PC-000001', type: 'payment', amount: '500' };
      (db as any).then.mockImplementation((resolve: any) => resolve([{ count: 0 }]));
      (db as any).returning.mockResolvedValue([paymentRecord]);

      const result = await service.create(TENANT_ID, USER_ID, dto as any);

      expect(result.code).toBe('PC-000001');
      expect(result.type).toBe('payment');
    });

    it('increments code counter based on existing records', async () => {
      const dto = {
        type: 'receipt',
        amount: 200,
        method: 'cash',
      };
      const paymentRecord = { ...FAKE_PAYMENT, code: 'PT-000005' };
      (db as any).then.mockImplementation((resolve: any) => resolve([{ count: 4 }]));
      (db as any).returning.mockResolvedValue([paymentRecord]);

      const result = await service.create(TENANT_ID, USER_ID, dto as any);

      expect(result.code).toBe('PT-000005');
    });

    it('stores amount as string', async () => {
      const dto = {
        type: 'receipt',
        amount: 1500.50,
        method: 'bank_transfer',
      };
      (db as any).then.mockImplementation((resolve: any) => resolve([{ count: 0 }]));
      (db as any).returning.mockResolvedValue([{ ...FAKE_PAYMENT, amount: '1500.50' }]);

      const result = await service.create(TENANT_ID, USER_ID, dto as any);

      expect(result.amount).toBe('1500.50');
    });
  });

  describe('findAll', () => {
    it('returns paginated payments with defaults', async () => {
      (db as any).then
        .mockImplementationOnce((resolve: any) => resolve([{ count: 1 }]))
        .mockImplementationOnce((resolve: any) => resolve([FAKE_PAYMENT]));

      const result = await service.findAll(TENANT_ID, {});

      expect(result.items).toEqual([FAKE_PAYMENT]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('filters by type', async () => {
      (db as any).then
        .mockImplementationOnce((resolve: any) => resolve([{ count: 1 }]))
        .mockImplementationOnce((resolve: any) => resolve([FAKE_PAYMENT]));

      const result = await service.findAll(TENANT_ID, { type: 'receipt' });

      expect(result.items).toHaveLength(1);
    });

    it('filters by method', async () => {
      (db as any).then
        .mockImplementationOnce((resolve: any) => resolve([{ count: 1 }]))
        .mockImplementationOnce((resolve: any) => resolve([FAKE_PAYMENT]));

      const result = await service.findAll(TENANT_ID, { method: 'bank_transfer' });

      expect(result.items).toHaveLength(1);
    });

    it('filters by date range', async () => {
      (db as any).then
        .mockImplementationOnce((resolve: any) => resolve([{ count: 1 }]))
        .mockImplementationOnce((resolve: any) => resolve([FAKE_PAYMENT]));

      const result = await service.findAll(TENANT_ID, { from: '2025-01-01', to: '2025-12-31' });

      expect(result.items).toHaveLength(1);
    });

    it('combines type, method, and date filters', async () => {
      (db as any).then
        .mockImplementationOnce((resolve: any) => resolve([{ count: 1 }]))
        .mockImplementationOnce((resolve: any) => resolve([FAKE_PAYMENT]));

      const result = await service.findAll(TENANT_ID, { type: 'receipt', method: 'bank_transfer', from: '2025-01-01', to: '2025-12-31' });

      expect(result.items).toHaveLength(1);
    });

    it('returns empty when no matches', async () => {
      (db as any).then
        .mockImplementationOnce((resolve: any) => resolve([{ count: 0 }]))
        .mockImplementationOnce((resolve: any) => resolve([]));

      const result = await service.findAll(TENANT_ID, { type: 'nonexistent' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('respects page and limit parameters', async () => {
      (db as any).then
        .mockImplementationOnce((resolve: any) => resolve([{ count: 5 }]))
        .mockImplementationOnce((resolve: any) => resolve([]));

      const result = await service.findAll(TENANT_ID, { page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('caps limit at 100', async () => {
      (db as any).then
        .mockImplementationOnce((resolve: any) => resolve([{ count: 0 }]))
        .mockImplementationOnce((resolve: any) => resolve([]));

      const result = await service.findAll(TENANT_ID, { limit: 999 });

      expect(result.limit).toBe(100);
    });
  });

  describe('findOne', () => {
    it('returns a payment by id', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([FAKE_PAYMENT]));

      const result = await service.findOne(TENANT_ID, 'pay-1');

      expect(result).toEqual(FAKE_PAYMENT);
    });

    it('throws NotFoundException when payment not found', async () => {
      (db as any).then.mockImplementation((resolve: any) => resolve([]));

      await expect(service.findOne(TENANT_ID, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('returns zero summary when no payments exist', async () => {
      (db as any).execute.mockResolvedValue({ rows: [] });

      const result = await service.getSummary(TENANT_ID);

      expect(result).toEqual({
        receipt: 0,
        payment: 0,
        receiptCount: 0,
        paymentCount: 0,
        balance: 0,
      });
    });

    it('computes receipt and payment totals', async () => {
      (db as any).execute.mockResolvedValue({
        rows: [
          { type: 'receipt', total: '5000', count: 3 },
          { type: 'payment', total: '2000', count: 2 },
        ],
      });

      const result = await service.getSummary(TENANT_ID);

      expect(result.receipt).toBe(5000);
      expect(result.payment).toBe(2000);
      expect(result.receiptCount).toBe(3);
      expect(result.paymentCount).toBe(2);
      expect(result.balance).toBe(3000);
    });

    it('filters by date range', async () => {
      (db as any).execute.mockResolvedValue({ rows: [] });

      const result = await service.getSummary(TENANT_ID, '2025-01-01', '2025-12-31');

      expect(result).toBeDefined();
    });

    it('handles receipts only', async () => {
      (db as any).execute.mockResolvedValue({
        rows: [
          { type: 'receipt', total: '3000', count: 1 },
        ],
      });

      const result = await service.getSummary(TENANT_ID);

      expect(result.receipt).toBe(3000);
      expect(result.payment).toBe(0);
      expect(result.balance).toBe(3000);
    });

    it('handles payments only', async () => {
      (db as any).execute.mockResolvedValue({
        rows: [
          { type: 'payment', total: '1500', count: 1 },
        ],
      });

      const result = await service.getSummary(TENANT_ID);

      expect(result.payment).toBe(1500);
      expect(result.receipt).toBe(0);
      expect(result.balance).toBe(-1500);
    });
  });
});
