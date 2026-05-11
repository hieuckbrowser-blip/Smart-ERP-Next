import { Injectable } from '@nestjs/common';

@Injectable()
export class ForecastService {
  private cache = new Map<string, any>();

  async getDemandForecast(productId?: string, days: number = 30) {
    const cacheKey = `${productId || 'all'}:${days}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Generate mock forecast data
    const forecast = [];
    const now = new Date();
    const baseDemand = productId ? 100 : 500;

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const predictedDemand = Math.max(0, baseDemand + Math.floor(Math.random() * 50) - 25);
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedDemand,
        lowerBound: Math.max(0, predictedDemand - 10),
        upperBound: predictedDemand + 10,
      });
    }

    const result = {
      productId: productId || null,
      forecast,
      metrics: {
        mape: 12.4,
        recommendedReorderQuantity: Math.ceil(forecast.reduce((sum, f) => sum + f.predictedDemand, 0) / 7) * 7,
        confidence: 'medium',
      },
    };

    this.cache.set(cacheKey, result);
    return result;
  }
}
