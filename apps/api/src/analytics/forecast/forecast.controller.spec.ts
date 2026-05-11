import { Test, TestingModule } from '@nestjs/testing';
import { ForecastController } from './forecast.controller';
import { ForecastService } from './forecast.service';

describe('ForecastController', () => {
  let controller: ForecastController;
  let service: ForecastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForecastController],
      providers: [
        {
          provide: ForecastService,
          useValue: {
            getDemandForecast: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ForecastController>(ForecastController);
    service = module.get<ForecastService>(ForecastService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDemandForecast', () => {
    it('should call forecastService.getDemandForecast with default days', async () => {
      const mockResult = { forecast: [], metrics: {} };
      (service.getDemandForecast as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getDemandForecast();

      expect(service.getDemandForecast).toHaveBeenCalledWith(undefined, 30);
      expect(result).toBe(mockResult);
    });

    it('should pass productId and days to the service', async () => {
      const mockResult = { forecast: [], metrics: {} };
      (service.getDemandForecast as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getDemandForecast('prod-123', '45');

      expect(service.getDemandForecast).toHaveBeenCalledWith('prod-123', 45);
      expect(result).toBe(mockResult);
    });
  });
});
