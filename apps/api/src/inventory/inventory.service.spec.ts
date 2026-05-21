import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { DrizzleService } from '../drizzle/drizzle.service';

describe('InventoryService - Reorder & Transactions', () => {
  let service: InventoryService;
  let drizzleService: DrizzleService;

  const mockDrizzleService = {
    db: {
      select: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    drizzleService = module.get<DrizzleService>(DrizzleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReorderSuggestions', () => {
    it('should return empty array when no products need reorder', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            id: 'prod-1',
            name: 'Product 1',
            sku: 'SKU001',
            stock: 100,
            minStock: 50,
            reorderQuantity: 20,
          },
        ]),
        orderBy: jest.fn().mockReturnThis(),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getReorderSuggestions(tenantId);

      expect(result).toEqual([]);
    });

    it('should return products below minimum stock', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            id: 'prod-1',
            name: 'Product 1',
            sku: 'SKU001',
            stock: 10,
            minStock: 50,
            reorderQuantity: 30,
          },
        ]),
        orderBy: jest.fn().mockReturnThis(),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getReorderSuggestions(tenantId);

      expect(result.length).toBe(1);
      expect(result[0].suggestedOrderQuantity).toBe(30);
    });

    it('should calculate suggested order quantity correctly', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            id: 'prod-1',
            name: 'Product 1',
            sku: 'SKU001',
            stock: 20,
            minStock: 100,
            reorderQuantity: 50,
          },
        ]),
        orderBy: jest.fn().mockReturnThis(),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getReorderSuggestions(tenantId);

      expect(result[0].suggestedOrderQuantity).toBe(50);
    });

    it('should filter by tenantId', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
        orderBy: jest.fn().mockReturnThis(),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      await service.getReorderSuggestions(tenantId);

      expect(mockQueryChain.where).toHaveBeenCalled();
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const tenantId = 'tenant-1';
      const query = { page: 1, limit: 30 };

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([
          {
            id: 'trans-1',
            productId: 'prod-1',
            type: 'in',
            quantity: 100,
            createdAt: new Date(),
          },
        ]),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getTransactions(tenantId, query);

      expect(result).toBeDefined();
    });

    it('should enforce maximum limit of 100', async () => {
      const tenantId = 'tenant-1';
      const query = { page: 1, limit: 500 };

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      await service.getTransactions(tenantId, query);

      expect(mockQueryChain.limit).toHaveBeenCalledWith(100);
    });

    it('should filter by productId when provided', async () => {
      const tenantId = 'tenant-1';
      const query = { page: 1, limit: 30, productId: 'prod-1' };

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      await service.getTransactions(tenantId, query);

      expect(mockQueryChain.where).toHaveBeenCalled();
    });

    it('should calculate correct offset for pagination', async () => {
      const tenantId = 'tenant-1';
      const query = { page: 3, limit: 30 };

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      await service.getTransactions(tenantId, query);

      expect(mockQueryChain.offset).toHaveBeenCalledWith(60);
    });
  });
});
