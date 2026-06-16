jest.mock('@smart-erp/database', () => ({ db: { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() } }));
jest.mock('@smart-erp/database/schema', () => ({ customers: 'customers' }));
jest.mock('@smart-erp/database/drizzle', () => ({ eq: jest.fn((f, v) => ({ op: 'eq', f, v })), and: jest.fn((...c) => ({ op: 'and', c })), ilike: jest.fn((f, v) => ({ op: 'ilike', f, v })), or: jest.fn((...c) => ({ op: 'or', c })) }));

import { CustomersService } from './customers.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { db } from '@smart-erp/database';

const mockActivityService = { log: jest.fn() };

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

  it('update modifies customer', async () => {
    (db.update as jest.Mock).mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: 'c-1', name: 'Updated' }]) }) }) });
    const r = await service.update('t1', 'u1', 'c-1', { name: 'Updated' } as any);
    expect(r.name).toBe('Updated');
  });

  it('remove deletes customer', async () => {
    (db.delete as jest.Mock).mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: 'c-1' }]) }) });
    expect((await service.remove('t1', 'u1', 'c-1')).id).toBe('c-1');
  });
});
