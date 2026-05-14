import { Injectable, CACHE_MANAGER } from '@nestjs/common';
import { Inject, ConfigService } from '@nestjs/common';
import { Cache } from 'cache-manager';

/**
 * AI forecasting service with caching layer.
 * Results are cached for 60 seconds to reduce redundant computation.
 */
@Injectable()
export class ForecastService {
  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Return dummy monthly demand data for a product.
   * @param productId ID of the product to forecast
   * @returns Array of { month: string, demand: number }
   */
  async getMonthlyDemand(productId: string) {
    const cacheKey = `forecast:${productId}`;
    const cached = await this.cacheManager.get<{ month: string; demand: number }[]>(cacheKey);
    if (cached) return { productId, data: cached };

    // Placeholder: generate a simple linear growth pattern.
    const base = 100;
    const result = Array.from({ length: 6 }, (_, i) => ({
      month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toLocaleString('en-US', { month: 'short' }),
      demand: base + i * 20,
    }));

    await this.cacheManager.set(cacheKey, result, { ttl: 60 });
    return { productId, data: result };
  }
}
