import { InventoryController } from './inventory.controller';

describe('InventoryController', () => {
  let svc: any;
  let ctrl: InventoryController;

  beforeEach(() => {
    svc = {
      getTransactions: jest.fn(),
      adjust: jest.fn(),
      getLowStock: jest.fn(),
      getSummary: jest.fn(),
      getReorderSuggestions: jest.fn(),
      getAvailableStock: jest.fn(),
      createReservation: jest.fn(),
      releaseReservation: jest.fn(),
      consumeReservation: jest.fn(),
      pushStockToMarketplace: jest.fn(),
      syncAllStoresStock: jest.fn(),
    };
    ctrl = new InventoryController(svc);
  });

  const req = { user: { tenantId: 't1', sub: 'u1' } };

  it('getTransactions delegates to service', async () => {
    svc.getTransactions.mockResolvedValue({ items: [], total: 0 });
    await ctrl.getTransactions(req, '1', '20', 'p1', 'IN');
    expect(svc.getTransactions).toHaveBeenCalledWith('t1', { page: 1, limit: 20, productId: 'p1', type: 'IN' });
  });

  it('adjust delegates to service', async () => {
    svc.adjust.mockResolvedValue({ id: 'tx1' });
    const body = { productId: 'p1', quantity: 10, type: 'IN' as const, notes: 'add stock' };
    const r = await ctrl.adjust(req, body);
    expect(svc.adjust).toHaveBeenCalledWith('t1', 'u1', 'p1', 10, 'IN', 'add stock', undefined);
    expect(r).toEqual({ id: 'tx1' });
  });

  it('getLowStock delegates to service', async () => {
    svc.getLowStock.mockResolvedValue([]);
    await ctrl.getLowStock(req);
    expect(svc.getLowStock).toHaveBeenCalledWith('t1');
  });

  it('getSummary delegates to service', async () => {
    svc.getSummary.mockResolvedValue({ totalProducts: 10, lowStock: 2 });
    await ctrl.getSummary(req);
    expect(svc.getSummary).toHaveBeenCalledWith('t1');
  });

  it('getReorderSuggestions delegates to service', async () => {
    svc.getReorderSuggestions.mockResolvedValue([]);
    await ctrl.getReorderSuggestions(req);
    expect(svc.getReorderSuggestions).toHaveBeenCalledWith('t1');
  });

  it('getAvailableStock delegates to service', async () => {
    svc.getAvailableStock.mockResolvedValue({ available: 5 });
    await ctrl.getAvailableStock(req, 'p1', 'store-1');
    expect(svc.getAvailableStock).toHaveBeenCalledWith('t1', 'p1', 'store-1');
  });

  it('createReservation delegates to service', async () => {
    svc.createReservation.mockResolvedValue({ id: 'r1' });
    const body = { storeId: 's1', externalOrderId: 'order-1', productId: 'p1', quantity: 2 };
    const r = await ctrl.createReservation(req, body);
    expect(svc.createReservation).toHaveBeenCalledWith('t1', 's1', 'order-1', 'p1', 2);
    expect(r).toEqual({ id: 'r1' });
  });

  it('releaseReservation delegates to service', async () => {
    svc.releaseReservation.mockResolvedValue({ success: true });
    const r = await ctrl.releaseReservation(req, { externalOrderId: 'order-1' });
    expect(svc.releaseReservation).toHaveBeenCalledWith('t1', 'order-1');
    expect(r).toEqual({ success: true });
  });

  it('consumeReservation delegates to service', async () => {
    svc.consumeReservation.mockResolvedValue({ success: true });
    await ctrl.consumeReservation(req, { externalOrderId: 'order-1' });
    expect(svc.consumeReservation).toHaveBeenCalledWith('t1', 'order-1');
  });

  it('pushStockToMarketplace delegates to service', async () => {
    svc.pushStockToMarketplace.mockResolvedValue({ pushed: 5 });
    await ctrl.pushStockToMarketplace(req, 'store-1');
    expect(svc.pushStockToMarketplace).toHaveBeenCalledWith('t1', 'store-1');
  });

  it('syncAllStoresStock delegates to service', async () => {
    svc.syncAllStoresStock.mockResolvedValue({ synced: true });
    await ctrl.syncAllStoresStock(req);
    expect(svc.syncAllStoresStock).toHaveBeenCalledWith('t1');
  });
});
