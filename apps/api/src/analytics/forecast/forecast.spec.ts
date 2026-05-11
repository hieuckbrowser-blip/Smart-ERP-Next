import { Test, TestingModule } from '@nestjs/testing';
import { ForecastService } from './forecast.service';

describe('ForecastService', () => {
  let service: ForecastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ForecastService],
    }).compile();

    service = module.get<ForecastService>(ForecastService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDemandForecast', () => {
    it('should return a forecast array of length = days', async () => {
      const days = 5;
      const result = await service.getDemandForecast(undefined, days);
      expect(result.forecast).toHaveLength(days);
      expect(result).toHaveProperty('productId', null);
      expect(result).toHaveProperty('metrics');
    });

    it('should return cached result for the same productId and days', async () => {
      const productId = 'prod-123';
      const days = 10;
      const first = await service.getDemandForecast(productId, days);
      const second = await service.getDemandForecast(productId, days);
      expect(first).toBe(second); // same object reference from cache
    });
  });
});
