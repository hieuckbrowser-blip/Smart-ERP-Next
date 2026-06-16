import { EInvoiceController } from './e-invoice.controller';

describe('EInvoiceController', () => {
  let svc: any;
  let ctrl: EInvoiceController;

  beforeEach(() => {
    svc = {
      create: jest.fn(),
      issue: jest.fn(),
      cancel: jest.fn(),
      replace: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      getStats: jest.fn(),
    };
    ctrl = new EInvoiceController(svc);
  });

  const req = { user: { tenantId: 't1', sub: 'u1' } };

  it('create delegates to service', async () => {
    svc.create.mockResolvedValue({ id: 'inv-1' });
    const dto = { orderId: 'o1', total: 100000 } as any;
    const r = await ctrl.create(req, dto);
    expect(svc.create).toHaveBeenCalledWith('t1', 'u1', dto);
    expect(r).toEqual({ id: 'inv-1' });
  });

  it('issue delegates to service', async () => {
    svc.issue.mockResolvedValue({ id: 'inv-1', status: 'issued' });
    const r = await ctrl.issue(req, 'inv-1');
    expect(svc.issue).toHaveBeenCalledWith('t1', 'inv-1');
    expect(r).toEqual({ id: 'inv-1', status: 'issued' });
  });

  it('cancel delegates to service', async () => {
    svc.cancel.mockResolvedValue({ id: 'inv-1', status: 'cancelled' });
    const r = await ctrl.cancel(req, 'inv-1', { reason: 'error' });
    expect(svc.cancel).toHaveBeenCalledWith('t1', 'inv-1', 'error');
    expect(r).toEqual({ id: 'inv-1', status: 'cancelled' });
  });

  it('replace delegates to service', async () => {
    svc.replace.mockResolvedValue({ id: 'inv-2' });
    const dto = { orderId: 'o1', total: 100000 } as any;
    const r = await ctrl.replace(req, 'inv-1', dto);
    expect(svc.replace).toHaveBeenCalledWith('t1', 'inv-1', 'u1', dto);
    expect(r).toEqual({ id: 'inv-2' });
  });

  it('list delegates to service', async () => {
    svc.list.mockResolvedValue({ items: [], total: 0 });
    await ctrl.list(req, 'issued', '1');
    expect(svc.list).toHaveBeenCalledWith('t1', { status: 'issued', page: 1 });
  });

  it('findById delegates to service', async () => {
    svc.findById.mockResolvedValue({ id: 'inv-1' });
    const r = await ctrl.findById(req, 'inv-1');
    expect(svc.findById).toHaveBeenCalledWith('t1', 'inv-1');
    expect(r).toEqual({ id: 'inv-1' });
  });

  it('getStats delegates to service', async () => {
    svc.getStats.mockResolvedValue({ total: 5, issued: 3 });
    await ctrl.getStats(req, '2026', '3');
    expect(svc.getStats).toHaveBeenCalledWith('t1', 2026, 3);
  });
});
