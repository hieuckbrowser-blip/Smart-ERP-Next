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
    // Use undefined when productId is omitted to match service signature.
    const prodId = productId !== undefined ? productId : undefined;
    const numDays = days ? parseInt(days) : 30;
    return this.forecastService.getDemandForecast(prodId, numDays);
  }
}
