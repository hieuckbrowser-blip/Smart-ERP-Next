jest.mock('@smart-erp/database', () => ({ db: { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() } }));
jest.mock('@smart-erp/database/schema', () => ({ customers: 'customers' }));
jest.mock('@smart-erp/database/drizzle', () => {
  const fn = (strings: any, ...values: any[]) => ({ op: 'sql', strings, values });
  fn.raw = jest.fn((value: any) => ({ op: 'raw', value }));
  return { eq: jest.fn((f, v) => ({ op: 'eq', f, v })), and: jest.fn((...c) => ({ op: 'and', c })), ilike: jest.fn((f, v) => ({ op: 'ilike', f, v })), or: jest.fn((...c) => ({ op: 'or', c })), sql: fn };
});

import { CustomersService } from './customers.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { db } from '@smart-erp/database';

const mockActivityService = { log: jest.fn() };

const fullChain = (result: any) => ({
  from: jest.fn(() => ({
    where: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          offset: jest.fn().mockResolvedValue(result),
        })),
      })),
    })),
  })),
});

const countChain = (count: number) => ({
  from: jest.fn(() => ({
    where: jest.fn().mockResolvedValue([{ count }]),
  })),
});

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(() => { jest.clearAllMocks(); service = new CustomersService(mockActivityService as any); });

  it('create throws on duplicate code', async () => {
    (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{}]) }) });
    await expect(service.create('t1', 'u1', { code: 'DUP', name: 'T' } as any)).rejects.toThrow(ConflictException);
  });

  it('create succeeds', async () => {
    (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) });
    (db.insert as jest.Mock).mockReturnValue({ values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: 'c-1' }]) }) });
    expect((await service.create('t1', 'u1', { code: 'C', name: 'T' } as any)).id).toBe('c-1');
  });

  it('findOne returns customer', async () => {
    (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ id: 'c-1' }]) }) });
    expect((await service.findOne('t1', 'c-1')).id).toBe('c-1');
  });

  it('findOne throws on missing', async () => {
    (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) });
    await expect(service.findOne('t1', 'x')).rejects.toThrow(NotFoundException);
  });

  it('findAll returns paginated results with defaults', async () => {
    const items = [{ id: 'c-1', name: 'A' }, { id: 'c-2', name: 'B' }];
    (db.select as jest.Mock)
      .mockReturnValueOnce(countChain(2))
      .mockReturnValueOnce(fullChain(items));
    const result = await service.findAll('t1', {});
    expect(result.items).toEqual(items);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(1);
  });

  it('findAll applies search filter', async () => {
    (db.select as jest.Mock)
      .mockReturnValueOnce(countChain(1))
      .mockReturnValueOnce(fullChain([{ id: 'c-1' }]));
    await service.findAll('t1', { search: 'test' });
  });

  it('findAll applies group filter', async () => {
    (db.select as jest.Mock)
      .mockReturnValueOnce(countChain(0))
      .mockReturnValueOnce(fullChain([]));
    await service.findAll('t1', { group: 'retail' });
  });

  it('findAll applies isActive filter', async () => {
    (db.select as jest.Mock)
      .mockReturnValueOnce(countChain(0))
      .mockReturnValueOnce(fullChain([]));
    await service.findAll('t1', { isActive: true });
  });

  it('findAll caps limit at 100', async () => {
    (db.select as jest.Mock)
      .mockReturnValueOnce(countChain(0))
      .mockReturnValueOnce(fullChain([]));
    await service.findAll('t1', { limit: 500 });
  });

  it('update modifies customer', async () => {
    (db.update as jest.Mock).mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: 'c-1', name: 'Updated' }]) }) }) });
    const r = await service.update('t1', 'u1', 'c-1', { name: 'Updated' } as any);
    expect(r.name).toBe('Updated');
  });

  it('update throws if not found', async () => {
    (db.update as jest.Mock).mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }) }) });
    await expect(service.update('t1', 'u1', 'x', {} as any)).rejects.toThrow(NotFoundException);
  });

  it('remove deletes customer', async () => {
    (db.delete as jest.Mock).mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: 'c-1' }]) }) });
    expect((await service.remove('t1', 'u1', 'c-1')).id).toBe('c-1');
  });

  it('remove throws if not found', async () => {
    (db.delete as jest.Mock).mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }) });
    await expect(service.remove('t1', 'u1', 'x')).rejects.toThrow(NotFoundException);
  });
});
