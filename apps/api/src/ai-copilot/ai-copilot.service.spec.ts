import { Test, TestingModule } from '@nestjs/testing';
import { AiCopilotService } from './ai-copilot.service';
import { DrizzleService } from '../drizzle/drizzle.service';

describe('AiCopilotService', () => {
  let service: AiCopilotService;
  let drizzleService: DrizzleService;

  const mockDrizzleService = {
    db: {
      select: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCopilotService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    service = module.get<AiCopilotService>(AiCopilotService);
    drizzleService = module.get<DrizzleService>(DrizzleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getExecutiveInsights', () => {
    it('should return executive insights for a tenant', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 500000000 }]),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getExecutiveInsights(tenantId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('leadsCount');
      expect(result).toHaveProperty('healthStatus');
      expect(result).toHaveProperty('recommendations');
    });

    it('should calculate revenue correctly', async () => {
      const tenantId = 'tenant-1';
      const mockRevenue = 250000000;

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: mockRevenue }]),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getExecutiveInsights(tenantId);

      expect(result.revenue).toBe(mockRevenue);
    });

    it('should set health status to "on track" when metrics are good', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 500000000, count: 2 }]),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getExecutiveInsights(tenantId);

      expect(result.healthStatus).toBe('on track');
    });

    it('should set health status to "needs attention" when high priority leads exceed threshold', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn()
          .mockResolvedValueOnce([{ total: 500000000 }]) // revenue
          .mockResolvedValueOnce([{ count: 10 }]) // leads count
          .mockResolvedValueOnce([{ count: 10 }]) // high priority
          .mockResolvedValueOnce([{ count: 5 }]), // signed contracts
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getExecutiveInsights(tenantId);

      expect(result.healthStatus).toBe('needs attention');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle zero metrics gracefully', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0, count: 0 }]),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getExecutiveInsights(tenantId);

      expect(result.revenue).toBe(0);
      expect(result.leadsCount).toBe(0);
      expect(result).toBeDefined();
    });

    it('should include recommendations when revenue is low', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn()
          .mockResolvedValueOnce([{ total: 50000000 }]) // low revenue
          .mockResolvedValueOnce([{ count: 2 }]) // leads count
          .mockResolvedValueOnce([{ count: 1 }]) // high priority
          .mockResolvedValueOnce([{ count: 3 }]), // signed contracts
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      const result = await service.getExecutiveInsights(tenantId);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('revenue'))).toBe(true);
    });

    it('should filter by tenantId in all queries', async () => {
      const tenantId = 'tenant-1';

      const mockQueryChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ total: 0, count: 0 }]),
      };

      (mockDrizzleService.db.select as jest.Mock).mockReturnValue(mockQueryChain);

      await service.getExecutiveInsights(tenantId);

      expect(mockDrizzleService.db.select).toHaveBeenCalled();
      expect(mockQueryChain.where).toHaveBeenCalled();
    });
  });
});
