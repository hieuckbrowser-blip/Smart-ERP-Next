jest.mock('@smart-erp/database', () => ({
  db: { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
jest.mock('@smart-erp/database/schema', () => ({ customers: 'customers' }));
jest.mock('@smart-erp/database/drizzle', () => ({
  eq: jest.fn((f, v) => ({ op: 'eq', f, v })),
  and: jest.fn((...c: any[]) => ({ op: 'and', c })),
  ilike: jest.fn((f, v) => ({ op: 'ilike', f, v })),
  or: jest.fn((...c: any[]) => ({ op: 'or', c })),
  sql: jest.fn((s: any) => ({ op: 'sql', s })),
  desc: jest.fn((f: any) => ({ op: 'desc', f })),
}));

import { CustomersService } from './customers.service';
import { ConflictException } from '@nestjs/common';
import { db } from '@smart-erp/database';

const mockActivityService = { log: jest.fn() };

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomersService(mockActivityService as any);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws ConflictException on duplicate code', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ id: 'existing' }]) }),
    });
    await expect(service.create('t1', 'u1', { code: 'DUP', name: 'Test' } as any)).rejects.toThrow(ConflictException);
  });

  it('create succeeds with unique code', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }),
    });
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: 'c-1', code: 'CUS-001' }]) }),
    });
    const result = await service.create('t1', 'u1', { code: 'CUS-001', name: 'Test Customer' } as any);
    expect(result.id).toBe('c-1');
  });
});
