import { Controller, Get, Query } from '@nestjs/common';
import { ForecastService } from './forecast.service';

@Controller('analytics/forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get('demand')
  async getDemandForecast(
    @Query('productId') productId?: string,
    @Query('days') days?: string,
  ) {
    // Placeholder implementation
    return this.forecastService.getDemandForecast(productId, days ? parseInt(days) : 30);
  }
}
