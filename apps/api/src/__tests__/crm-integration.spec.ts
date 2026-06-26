jest.mock('@smart-erp/database', () => ({
  leads: { id: 'leads.id', tenantId: 'leads.tenantId', createdAt: 'leads.createdAt', status: 'leads.status', updatedAt: 'leads.updatedAt' },
  crmPipelines: { id: 'crmPipelines.id', tenantId: 'crmPipelines.tenantId' },
  crmStages: { id: 'crmStages.id', pipelineId: 'crmStages.pipelineId', sequence: 'crmStages.sequence' },
  crmDeals: { id: 'crmDeals.id', tenantId: 'crmDeals.tenantId', stageId: 'crmDeals.stageId', createdAt: 'crmDeals.createdAt', amount: 'crmDeals.amount' },
  orders: { id: 'orders.id', tenantId: 'orders.tenantId' },
}));

import { CrmService } from '../crm/crm.service';

function createQueryMock() {
  const qb: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
  };
  return qb;
}

describe('CrmService', () => {
  let service: CrmService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const mockDrizzleService = { db: mockDb };
    service = new (CrmService as any)(mockDrizzleService);
  });

  describe('getPipelines', () => {
    it('returns pipelines with their stages', async () => {
      const pipelines = [{ id: 'p1', name: 'Sales', tenantId: 't1' }];
      const stages = [{ id: 's1', name: 'Qualified', pipelineId: 'p1', sequence: 1 }];

      const qb1 = createQueryMock();
      qb1.where.mockResolvedValue(pipelines);
      const qb2 = createQueryMock();
      qb2.orderBy.mockResolvedValue(stages);

      mockDb.select.mockReturnValueOnce(qb1).mockReturnValueOnce(qb2);

      const result = await service.getPipelines('t1');

      expect(mockDb.select).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
      expect(result[0].stages).toEqual(stages);
    });

    it('returns empty array when no pipelines', async () => {
      const qb = createQueryMock();
      qb.where.mockResolvedValue([]);
      mockDb.select.mockReturnValue(qb);

      const result = await service.getPipelines('t1');

      expect(result).toEqual([]);
    });
  });

  describe('getDealsByStage', () => {
    it('returns deals filtered by tenant and stage', async () => {
      const deals = [{ id: 'd1', title: 'Deal 1', tenantId: 't1', stageId: 's1' }];
      const qb = createQueryMock();
      qb.orderBy.mockResolvedValue(deals);
      mockDb.select.mockReturnValue(qb);

      const result = await service.getDealsByStage('t1', 's1');

      expect(result).toEqual(deals);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('createDeal', () => {
    it('creates and returns a deal', async () => {
      const deal = { id: 'd1', tenantId: 't1', title: 'New Deal', stageId: 's1', amount: '50000', status: 'open' };
      const qb = createQueryMock();
      qb.returning.mockResolvedValue([deal]);
      mockDb.insert.mockReturnValue(qb);

      const result = await service.createDeal('t1', { title: 'New Deal', stageId: 's1', amount: 50000 });

      expect(result).toEqual(deal);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(qb.values).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', title: 'New Deal' }));
    });
  });

  describe('updateDealStage', () => {
    it('updates and returns the deal stage', async () => {
      const updated = { id: 'd1', tenantId: 't1', stageId: 's2', amount: '100', updatedAt: new Date() };
      const qb = createQueryMock();
      qb.returning.mockResolvedValue([updated]);
      mockDb.update.mockReturnValue(qb);

      const result = await service.updateDealStage('t1', 'd1', 's2');

      expect(result).toEqual(updated);
      expect(qb.set).toHaveBeenCalledWith(expect.objectContaining({ stageId: 's2' }));
    });

    it('returns undefined when deal not found', async () => {
      const qb = createQueryMock();
      qb.returning.mockResolvedValue([]);
      mockDb.update.mockReturnValue(qb);

      const result = await service.updateDealStage('t1', 'nonexistent', 's2');

      expect(result).toBeUndefined();
    });
  });

  describe('getLeads', () => {
    it('returns leads for tenant', async () => {
      const leadsData = [{ id: 'l1', name: 'Lead 1', tenantId: 't1' }];
      const qb = createQueryMock();
      qb.orderBy.mockResolvedValue(leadsData);
      mockDb.select.mockReturnValue(qb);

      const result = await service.getLeads('t1');

      expect(result).toEqual(leadsData);
    });
  });

  describe('createLead', () => {
    it('creates and returns a lead', async () => {
      const lead = { id: 'l1', tenantId: 't1', name: 'New Lead', status: 'new' };
      const qb = createQueryMock();
      qb.returning.mockResolvedValue([lead]);
      mockDb.insert.mockReturnValue(qb);

      const result = await service.createLead('t1', { name: 'New Lead' });

      expect(result).toEqual(lead);
      expect(qb.values).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', name: 'New Lead' }));
    });
  });

  describe('updateLeadStatus', () => {
    it('updates and returns the lead with new status', async () => {
      const updated = { id: 'l1', tenantId: 't1', status: 'qualified', updatedAt: new Date() };
      const qb = createQueryMock();
      qb.returning.mockResolvedValue([updated]);
      mockDb.update.mockReturnValue(qb);

      const result = await service.updateLeadStatus('t1', 'l1', 'qualified');

      expect(result).toEqual(updated);
      expect(qb.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'qualified' }));
    });

    it('throws NotFoundException when lead does not exist', async () => {
      const qb = createQueryMock();
      qb.returning.mockResolvedValue([]);
      mockDb.update.mockReturnValue(qb);

      await expect(service.updateLeadStatus('t1', 'nonexistent', 'won')).rejects.toThrow('Lead not found');
    });
  });

  describe('convertToOrder', () => {
    it('converts a deal to an order and marks deal as won', async () => {
      const deal = { id: 'd1', tenantId: 't1', leadId: 'l1', amount: '100000', status: 'open' };
      const order = { id: 'o1', tenantId: 't1', customerId: 'l1', totalAmount: '100000', status: 'pending' };

      const qb1 = createQueryMock();
      qb1.where.mockResolvedValue([deal]);
      const qb2 = createQueryMock();
      qb2.returning.mockResolvedValue([order]);
      const qb3 = createQueryMock();
      qb3.where.mockResolvedValue(undefined);

      mockDb.select.mockReturnValueOnce(qb1);
      mockDb.insert.mockReturnValueOnce(qb2);
      mockDb.update.mockReturnValueOnce(qb3);

      const result = await service.convertToOrder('t1', 'd1');

      expect(result).toEqual(order);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('throws NotFoundException when deal does not exist', async () => {
      const qb = createQueryMock();
      qb.where.mockResolvedValue([]);
      mockDb.select.mockReturnValue(qb);

      await expect(service.convertToOrder('t1', 'nonexistent')).rejects.toThrow('Deal not found');
    });
  });
});
