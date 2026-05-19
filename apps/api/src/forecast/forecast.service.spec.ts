// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { ForecastService } from './forecast.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ForecastService', () => {
  let service: ForecastService;
  let cacheManager: jest.Mocked<Cache>;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForecastService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ForecastService>(ForecastService);
    cacheManager = mockCacheManager as jest.Mocked<Cache>;

    mockConfigService.get.mockReturnValue('http://localhost:8000');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMonthlyDemand', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        productId: 'PROD-001',
        predictions: [{ date: '2024-01-01', quantity: 100 }],
        suggestedOrder: 50,
        confidenceLower: [],
        confidenceUpper: [],
        generatedAt: '2024-01-01T00:00:00Z',
      };

      cacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getMonthlyDemand('PROD-001');

      expect(result).toEqual(cachedData);
      expect(cacheManager.get).toHaveBeenCalledWith('forecast:PROD-001');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should call AI service when cache is empty', async () => {
      cacheManager.get.mockResolvedValue(null);

      const mockResponse = {
        data: {
          predicted_daily_demand: [
            { date: '2024-01-01', quantity: 100 },
            { date: '2024-01-02', quantity: 110 },
          ],
          suggested_order_quantity: 150,
          confidence_lower: [{ date: '2024-01-01', quantity: 90 }],
          confidence_upper: [{ date: '2024-01-01', quantity: 120 }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.getMonthlyDemand('PROD-001');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/forecast',
        expect.objectContaining({
          product_id: 'PROD-001',
          lookahead_days: 30,
        }),
        expect.objectContaining({ timeout: 10000 })
      );

      expect(result.productId).toBe('PROD-001');
      expect(result.predictions).toEqual(mockResponse.data.predicted_daily_demand);
      expect(result.suggestedOrder).toBe(150);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'forecast:PROD-001',
        expect.any(Object),
        { ttl: 300 }
      );
    });

    it('should return fallback forecast when AI service fails', async () => {
      cacheManager.get.mockResolvedValue(null);
      mockedAxios.post.mockRejectedValue(new Error('AI service unavailable'));

      const result = await service.getMonthlyDemand('PROD-001');

      expect(result.productId).toBe('PROD-001');
      expect(result).toHaveProperty('isFallback', true);
      expect(result).toHaveProperty('data');
    });

    it('should use custom AI service URL from config', async () => {
      cacheManager.get.mockResolvedValue(null);
      mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'AI_FORECAST_URL') return 'http://custom-ai:9000';
        return defaultValue ?? '';
      });

      // Re-create service with new config mock so constructor picks up custom URL
      const customModule = await Test.createTestingModule({
        providers: [
          ForecastService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: 'CACHE_MANAGER', useValue: mockCacheManager },
        ],
      }).compile();

      const customService = customModule.get<ForecastService>(ForecastService);

      mockedAxios.post.mockResolvedValue({
        data: {
          predicted_daily_demand: [],
          suggested_order_quantity: 0,
          confidence_lower: [],
          confidence_upper: [],
        },
      });

      await customService.getMonthlyDemand('PROD-001');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://custom-ai:9000/forecast',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should generate 60 days of sales history', async () => {
      cacheManager.get.mockResolvedValue(null);
      mockedAxios.post.mockResolvedValue({
        data: {
          predicted_daily_demand: [],
          suggested_order_quantity: 0,
          confidence_lower: [],
          confidence_upper: [],
        },
      });

      await service.getMonthlyDemand('PROD-001');

      const callArgs = mockedAxios.post.mock.calls[0][1];
      expect(callArgs.sales_history).toHaveLength(60);
      expect(callArgs.sales_history[0].date).toBeDefined();
      expect(typeof callArgs.sales_history[0].quantity).toBe('number');
    });

    it('should cache result for 5 minutes', async () => {
      cacheManager.get.mockResolvedValue(null);
      mockedAxios.post.mockResolvedValue({
        data: {
          predicted_daily_demand: [],
          suggested_order_quantity: 0,
          confidence_lower: [],
          confidence_upper: [],
        },
      });

      await service.getMonthlyDemand('PROD-001');

      expect(cacheManager.set).toHaveBeenCalledWith(
        'forecast:PROD-001',
        expect.any(Object),
        { ttl: 300 }
      );
    });
  });
});
