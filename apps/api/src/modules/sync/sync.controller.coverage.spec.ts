import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

describe('SyncController', () => {
  it('can be instantiated', () => {
    const service = {} as any;
    const controller = new SyncController(service);
    expect(controller).toBeDefined();
  });

  it('pull delegates to service', async () => {
    const service = { pull: jest.fn().mockResolvedValue({ changes: {}, vectorClock: {} }) } as any;
    const controller = new SyncController(service);
    const req = { user: { tenantId: 't1' } } as any;
    const result = await controller.pull(req, { clientId: 'c1', vectorClock: { products: 0 } });
    expect(service.pull).toHaveBeenCalledWith('t1', 'c1', { products: 0 });
    expect(result).toEqual({ changes: {}, vectorClock: {} });
  });

  it('push delegates to service', async () => {
    const service = { push: jest.fn().mockResolvedValue({ accepted: true }) } as any;
    const controller = new SyncController(service);
    const req = { user: { tenantId: 't1' } } as any;
    const result = await controller.push(req, { clientId: 'c1', changes: { products: [] } });
    expect(service.push).toHaveBeenCalledWith('t1', 'c1', { products: [] });
    expect(result).toEqual({ accepted: true });
  });

  it('getMetadata delegates to service', async () => {
    const service = { getMetadata: jest.fn().mockResolvedValue({ id: 'm1' }) } as any;
    const controller = new SyncController(service);
    const req = { user: { tenantId: 't1' } } as any;
    const result = await controller.getMetadata(req, 'c1');
    expect(service.getMetadata).toHaveBeenCalledWith('t1', 'c1');
    expect(result).toEqual({ id: 'm1' });
  });
});
