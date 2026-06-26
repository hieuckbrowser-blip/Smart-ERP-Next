jest.mock('@smart-erp/database', () => ({
  db: { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
jest.mock('@smart-erp/database/schema', () => ({ crmLeads: {}, customers: {} }));
jest.mock('@smart-erp/database/drizzle', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  ilike: jest.fn(),
  or: jest.fn(),
  sql: jest.fn(),
  desc: jest.fn(),
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '@smart-erp/database';
import { LeadsService } from '../crm/leads/leads.service';

function queryBuilder(result: any) {
  const chain: any = {};
  chain.from = jest.fn();
  chain.where = jest.fn();
  chain.orderBy = jest.fn();
  chain.limit = jest.fn();
  chain.offset = jest.fn();
  chain.groupBy = jest.fn();
    chain.then = (resolve: (...args: any[]) => any) => resolve(result);
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.offset.mockReturnValue(chain);
  chain.groupBy.mockReturnValue(chain);
  return chain;
}

function mockInsert(returningValue: any) {
  return {
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue(returningValue),
    }),
  };
}

function mockUpdate(returningValue: any) {
  return {
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(returningValue),
      }),
    }),
  };
}

function mockDelete() {
  return {
    where: jest.fn().mockResolvedValue(undefined),
  };
}

describe('LeadsService', () => {
  let service: LeadsService;
  let mockActivityService: { log: jest.Mock };
  let mockNotifications: { broadcastToTenant: jest.Mock };

  const tenantId = 't1';
  const userId = 'user-1';
  const leadId = 'lead-1';

  const mockLead = {
    id: leadId,
    tenantId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '0123456789',
    company: 'Acme Corp',
    source: 'website',
    status: 'new',
    leadScore: '50',
    industry: 'Technology',
    description: 'Interested in ERP',
    assignedToId: null,
    createdBy: userId,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    convertedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockActivityService = { log: jest.fn().mockResolvedValue(undefined) };
    mockNotifications = { broadcastToTenant: jest.fn() };
    service = new (LeadsService as any)(mockActivityService, mockNotifications);
  });

  describe('create', () => {
    const dto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '0123456789',
      company: 'Acme Corp',
      source: 'website',
      status: 'new',
      leadScore: 50,
      industry: 'Technology',
      description: 'Interested in ERP',
    };

    it('creates a lead with all fields and logs activity', async () => {
      (db.insert as jest.Mock).mockReturnValue(mockInsert([mockLead]));

      const result = await service.create(tenantId, userId, dto);

      expect(result).toEqual(mockLead);
      expect(mockActivityService.log).toHaveBeenCalledWith(
        tenantId, userId, 'created', 'lead', leadId,
        expect.objectContaining({ name: 'John Doe' }),
      );
      expect(mockNotifications.broadcastToTenant).toHaveBeenCalledWith(
        tenantId, 'lead.created',
        expect.objectContaining({ leadId, name: 'John Doe' }),
      );
    });

    it('uses defaults for source, status, and leadScore', async () => {
      const minimalDto = { firstName: 'Jane', lastName: 'Smith' };
      let capturedValues: any;
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn((v: any) => {
          capturedValues = v;
          return { returning: jest.fn().mockResolvedValue([{ ...mockLead, id: 'lead-2', firstName: 'Jane', lastName: 'Smith' }]) };
        }),
      });

      await service.create(tenantId, userId, minimalDto as any);

      expect(capturedValues.source).toBe('other');
      expect(capturedValues.status).toBe('new');
      expect(capturedValues.leadScore).toBe('0');
    });
  });

  describe('findAll', () => {
    it('returns paginated results with defaults', async () => {
      (db.select as jest.Mock)
        .mockReturnValueOnce(queryBuilder([{ count: 25 }]))
        .mockReturnValueOnce(queryBuilder([mockLead]));

      const result = await service.findAll(tenantId, {});

      expect(result).toEqual({
        items: [mockLead],
        total: 25,
        page: 1,
        limit: 20,
        totalPages: 2,
      });
    });

    it('applies search, status, source, and assignedTo filters', async () => {
      (db.select as jest.Mock)
        .mockReturnValueOnce(queryBuilder([{ count: 1 }]))
        .mockReturnValueOnce(queryBuilder([mockLead]));

      const result = await service.findAll(tenantId, {
        search: 'john',
        status: 'new',
        source: 'website',
        assignedToId: 'user-2',
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('enforces max limit of 100', async () => {
      const manyLeads = Array.from({ length: 100 }, (_, i) => ({ ...mockLead, id: `lead-${i}` }));
      (db.select as jest.Mock)
        .mockReturnValueOnce(queryBuilder([{ count: 500 }]))
        .mockReturnValueOnce(queryBuilder(manyLeads));

      const result = await service.findAll(tenantId, { page: 1, limit: 999 });

      expect(result.limit).toBe(100);
      expect(result.items).toHaveLength(100);
    });

    it('returns empty result when no leads match', async () => {
      (db.select as jest.Mock)
        .mockReturnValueOnce(queryBuilder([{ count: 0 }]))
        .mockReturnValueOnce(queryBuilder([]));

      const result = await service.findAll(tenantId, { page: 99 });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('returns a lead when found', async () => {
      (db.select as jest.Mock).mockReturnValue(queryBuilder([mockLead]));

      const result = await service.findOne(tenantId, leadId);

      expect(result).toEqual(mockLead);
    });

    it('throws NotFoundException when lead does not exist', async () => {
      (db.select as jest.Mock).mockReturnValue(queryBuilder([]));

      await expect(service.findOne(tenantId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates lead fields and logs activity', async () => {
      (db.select as jest.Mock).mockReturnValue(queryBuilder([mockLead]));
      const updated = { ...mockLead, firstName: 'Jane', status: 'qualified', updatedAt: new Date() };
      (db.update as jest.Mock).mockReturnValue(mockUpdate([updated]));

      const result = await service.update(tenantId, leadId, { firstName: 'Jane', status: 'qualified' });

      expect(result.firstName).toBe('Jane');
      expect(mockActivityService.log).toHaveBeenCalledWith(
        tenantId, '', 'updated', 'lead', leadId,
        { changes: expect.arrayContaining(['firstName', 'status']) },
      );
    });

    it('throws NotFoundException when lead to update does not exist', async () => {
      (db.select as jest.Mock).mockReturnValue(queryBuilder([]));

      await expect(service.update(tenantId, 'nonexistent', { firstName: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes lead and logs activity', async () => {
      (db.select as jest.Mock).mockReturnValue(queryBuilder([mockLead]));
      (db.delete as jest.Mock).mockReturnValue(mockDelete());

      const result = await service.remove(tenantId, leadId);

      expect(result).toEqual({ success: true });
      expect(mockActivityService.log).toHaveBeenCalledWith(
        tenantId, '', 'deleted', 'lead', leadId,
        { name: 'John Doe' },
      );
    });

    it('throws NotFoundException when lead to delete does not exist', async () => {
      (db.select as jest.Mock).mockReturnValue(queryBuilder([]));

      await expect(service.remove(tenantId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('returns stats grouped by status', async () => {
      const stats = [
        { status: 'new', count: 10 },
        { status: 'qualified', count: 5 },
        { status: 'won', count: 3 },
      ];
      (db.select as jest.Mock).mockReturnValue(queryBuilder(stats));

      const result = await service.getStats(tenantId);

      expect(result.total).toBe(18);
      expect(result.winRate).toBe(17);
      expect(result.byStatus).toEqual(stats);
    });

    it('returns zero winRate when no leads exist', async () => {
      (db.select as jest.Mock).mockReturnValue(queryBuilder([]));

      const result = await service.getStats(tenantId);

      expect(result.total).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.byStatus).toEqual([]);
    });
  });

  describe('convertToCustomer', () => {
    it('throws BadRequestException when lead is already won', async () => {
      (db.select as jest.Mock).mockReturnValue(queryBuilder([{ ...mockLead, status: 'won' }]));

      await expect(service.convertToCustomer(tenantId, leadId)).rejects.toThrow(BadRequestException);
    });

    it('converts lead to customer and broadcasts notification', async () => {
      (db.select as jest.Mock).mockReturnValue(queryBuilder([mockLead]));
      const converted = { ...mockLead, status: 'won', convertedAt: new Date(), updatedAt: new Date() };
      (db.update as jest.Mock).mockReturnValue(mockUpdate([converted]));

      const result = await service.convertToCustomer(tenantId, leadId);

      expect(result.status).toBe('won');
      expect(result.convertedAt).toBeDefined();
      expect(mockActivityService.log).toHaveBeenCalledWith(
        tenantId, '', 'updated', 'lead', leadId,
        expect.objectContaining({ action: 'converted_to_customer' }),
      );
      expect(mockNotifications.broadcastToTenant).toHaveBeenCalledWith(
        tenantId, 'lead.converted',
        expect.objectContaining({ leadId, name: 'John Doe' }),
      );
    });
  });
});
