import { Test, TestingModule } from '@nestjs/testing';
import { InventoryRecommendationService } from './inventory-recommendation.service';
import { ForecastService } from '../forecast/forecast.service';

describe('InventoryRecommendationService', () => {
  let service: InventoryRecommendationService;
  let mockForecastService: jest.Mocked<ForecastService>;

  beforeEach(async () => {
    mockForecastService = {
      getMonthlyDemand: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryRecommendationService,
        { provide: ForecastService, useValue: mockForecastService },
      ],
    }).compile();

    service = module.get<InventoryRecommendationService>(InventoryRecommendationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecommendation', () => {
    it('should return suggested reorder based on forecast demand', async () => {
      mockForecastService.getMonthlyDemand.mockResolvedValue([
        { month: 'Jan', demand: 100 },
        { month: 'Feb', demand: 120 },
        { month: 'Mar', demand: 140 },
      ]);

      const result = await service.getRecommendation('prod-1', 50);

      expect(result.productId).toBe('prod-1');
      expect(result.suggestedReorder).toBeGreaterThan(0);
    });

    it('should return zero suggested reorder when stock is sufficient', async () => {
      mockForecastService.getMonthlyDemand.mockResolvedValue([
        { month: 'Jan', demand: 10 },
        { month: 'Feb', demand: 10 },
        { month: 'Mar', demand: 10 },
      ]);

      const result = await service.getRecommendation('prod-2', 200);

      expect(result.suggestedReorder).toBe(0);
    });
  });
});