import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  let svc: any;
  let ctrl: PaymentsController;

  beforeEach(() => {
    svc = { create: jest.fn(), findAll: jest.fn(), getSummary: jest.fn(), findOne: jest.fn() };
    ctrl = new PaymentsController(svc);
  });

  const req = { user: { tenantId: 't1', sub: 'u1' } };

  it('create delegates to service', async () => {
    svc.create.mockResolvedValue({ id: 'p1' });
    const dto = { amount: 50000 } as any;
    const r = await ctrl.create(req, dto);
    expect(svc.create).toHaveBeenCalledWith('t1', 'u1', dto);
    expect(r).toEqual({ id: 'p1' });
  });

  it('findAll delegates to service', async () => {
    svc.findAll.mockResolvedValue({ items: [], total: 0 });
    await ctrl.findAll(req, '1', '20', 'in', 'cash', '2026-01-01', '2026-01-31');
    expect(svc.findAll).toHaveBeenCalledWith('t1', { page: 1, limit: 20, type: 'in', method: 'cash', from: '2026-01-01', to: '2026-01-31' });
  });

  it('getSummary delegates to service', async () => {
    svc.getSummary.mockResolvedValue({ totalIn: 100000, totalOut: 50000 });
    await ctrl.getSummary(req, '2026-01-01', '2026-01-31');
    expect(svc.getSummary).toHaveBeenCalledWith('t1', '2026-01-01', '2026-01-31');
  });

  it('findOne delegates to service', async () => {
    svc.findOne.mockResolvedValue({ id: 'p1' });
    const r = await ctrl.findOne(req, 'p1');
    expect(svc.findOne).toHaveBeenCalledWith('t1', 'p1');
    expect(r).toEqual({ id: 'p1' });
  });
});
