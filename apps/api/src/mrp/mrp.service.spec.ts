import { Test, TestingModule } from '@nestjs/testing';
import { MRPService } from './mrp.service';
import { DrizzleService } from '../drizzle/drizzle.service';

describe('MRPService', () => {
  let service: MRPService;
  let drizzleService: jest.Mocked<DrizzleService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    drizzleService = {
      db: {
        execute: jest.fn(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn(),
        orderBy: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockReturnThis(),
      },
    } as unknown as jest.Mocked<DrizzleService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MRPService,
        { provide: DrizzleService, useValue: drizzleService },
      ],
    }).compile();

    service = module.get<MRPService>(MRPService);
  });

  describe('calculateMRP', () => {
    it('should calculate net requirement correctly', async () => {
      (drizzleService.db.execute as jest.Mock)
        .mockResolvedValueOnce([{ id: 1, name: 'Widget', current_stock: 50, lead_time_days: 7, safety_stock: 10 }]) // product
        .mockResolvedValueOnce([{ total_forecast: 100 }]) // forecast
        .mockResolvedValueOnce([{ total_orders: 30 }]) // sales orders
        .mockResolvedValueOnce([]); // BOM

      (drizzleService.db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.calculateMRP('tenant-1', 1);

      expect(result.productId).toBe(1);
      expect(result.productName).toBe('Widget');
      expect(result.forecastedDemand).toBe(100);
      expect(result.salesOrderDemand).toBe(30);
      // net = max(0, 130 - 50 + 10) = 90
      expect(result.netRequirement).toBe(90);
      expect(result.suggestedProduction).toBe(90);
    });

    it('should return zero net requirement when stock is sufficient', async () => {
      (drizzleService.db.execute as jest.Mock)
        .mockResolvedValueOnce([{ id: 1, name: 'Widget', current_stock: 200, lead_time_days: 7, safety_stock: 10 }])
        .mockResolvedValueOnce([{ total_forecast: 50 }])
        .mockResolvedValueOnce([{ total_orders: 20 }])
        .mockResolvedValueOnce([]);

      (drizzleService.db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.calculateMRP('tenant-1', 1);

      // net = max(0, 70 - 200 + 10) = 0
      expect(result.netRequirement).toBe(0);
      expect(result.suggestedProduction).toBe(0);
    });

    it('should throw error when product not found', async () => {
      (drizzleService.db.execute as jest.Mock).mockResolvedValueOnce([]);

      await expect(service.calculateMRP('tenant-1', 999))
        .rejects.toThrow('Product not found');
    });

    it('should calculate BOM component gaps', async () => {
      (drizzleService.db.execute as jest.Mock)
        .mockResolvedValueOnce([{ id: 1, name: 'Widget', current_stock: 0, lead_time_days: 7, safety_stock: 0 }])
        .mockResolvedValueOnce([{ total_forecast: 100 }])
        .mockResolvedValueOnce([{ total_orders: 0 }])
        .mockResolvedValueOnce([
          { id: 10, component_name: 'Steel', current_stock: 50, required_qty: 200 },
          { id: 11, component_name: 'Paint', current_stock: 100, required_qty: 50 },
        ]);

      (drizzleService.db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.calculateMRP('tenant-1', 1);

      expect(result.bomComponents).toHaveLength(2);
      expect(result.bomComponents[0].gap).toBe(150); // 200 - 50
      expect(result.bomComponents[1].gap).toBe(0);   // 50 - 100 = 0 (sufficient)
      expect(result.rawMaterialGap).toBe(150);
    });
  });

  describe('calculateMRPBatch', () => {
    it('should process all active products and sort by urgency', async () => {
      (drizzleService.db.execute as jest.Mock)
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // product list
        .mockResolvedValueOnce([{ id: 1, name: 'A', current_stock: 0, lead_time_days: 7, safety_stock: 0 }])
        .mockResolvedValueOnce([{ total_forecast: 100 }])
        .mockResolvedValueOnce([{ total_orders: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 2, name: 'B', current_stock: 500, lead_time_days: 7, safety_stock: 0 }])
        .mockResolvedValueOnce([{ total_forecast: 10 }])
        .mockResolvedValueOnce([{ total_orders: 0 }])
        .mockResolvedValueOnce([]);

      (drizzleService.db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      });

      const results = await service.calculateMRPBatch('tenant-1');

      expect(results).toHaveLength(2);
      // Product A (net=100) should come before Product B (net=0)
      expect(results[0].productName).toBe('A');
      expect(results[1].productName).toBe('B');
    });
  });
});