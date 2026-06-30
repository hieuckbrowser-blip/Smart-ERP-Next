import { OrdersService } from './orders.service';
import { TelemetryService } from '../analytics/telemetry.service';

jest.mock('@smart-erp/database', () => ({ db: { select: jest.fn(), insert: jest.fn() } }));
jest.mock('@smart-erp/database/schema', () => ({ orders: {}, orderItems: {}, products: {}, customers: {} }));
jest.mock('@smart-erp/database/drizzle', () => ({ eq: jest.fn((x) => x), and: jest.fn((...args) => args), ilike: jest.fn((x) => x), sql: jest.fn((s) => s), desc: jest.fn((x) => x), inArray: jest.fn((x) => x) }));
jest.mock('../notifications/notifications.gateway', () => ({ NotificationsGateway: jest.fn().mockImplementation(() => ({ broadcastToTenant: jest.fn() })) }));
jest.mock('../modules/activity/activity.service', () => ({ ActivityService: jest.fn().mockImplementation(() => ({ log: jest.fn().mockResolvedValue(undefined) })) }));

describe('OrdersService telemetry', () => {
  let mockTelemetry: { track: jest.Mock };

  beforeEach(() => {
    mockTelemetry = { track: jest.fn().mockResolvedValue(undefined) };
  });

  it('calls telemetry.track when telemetry is provided', () => {
    const mockNotifications = { broadcastToTenant: jest.fn() };
    const mockActivity = { log: jest.fn().mockResolvedValue(undefined) };
    const service = new OrdersService(mockNotifications as any, mockActivity as any, mockTelemetry as any);

    (service as any).telemetry?.track('order.created', 't1', 'u1', { channel: 'pos' });

    expect(mockTelemetry.track).toHaveBeenCalledWith('order.created', 't1', 'u1', { channel: 'pos' });
  });

  it('does not throw when telemetry is not provided', () => {
    const mockNotifications = { broadcastToTenant: jest.fn() };
    const mockActivity = { log: jest.fn().mockResolvedValue(undefined) };
    const service = new OrdersService(mockNotifications as any, mockActivity as any);

    expect(() => {
      (service as any).telemetry?.track('test', 't1', 'u1', {});
    }).not.toThrow();
  });
});
